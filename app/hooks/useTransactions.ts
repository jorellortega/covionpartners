import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '../../types/supabase'

export interface Transaction {
  id: string
  amount: number
  type: string
  status: string
  created_at: string
  project?: {
    name: string
  } | null
}

interface UseTransactionsProps {
  limit?: number
  page?: number
}

interface UseTransactionsReturn {
  data: {
    transactions: Transaction[]
    hasMore: boolean
  } | null
  isLoading: boolean
  error: Error | null
}

type Tables = Database['public']['Tables']
type TransactionRow = Tables['transactions']['Row']
type ProjectRow = Tables['projects']['Row']

type TransactionWithProject = TransactionRow & {
  project: ProjectRow | null
}

export function useTransactions({ limit = 10, page = 1 }: UseTransactionsProps = {}): UseTransactionsReturn {
  const [data, setData] = useState<{ transactions: Transaction[], hasMore: boolean } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    let isMounted = true

    const fetchTransactions = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          throw new Error('No session found')
        }

        // Calculate offset based on page and limit
        const offset = (page - 1) * limit

        // Fetch transactions with pagination
        const { data: transactions, error: fetchError } = await supabase
          .from('transactions')
          .select(`
            id,
            amount,
            type,
            status,
            created_at,
            project:project_id (
              name
            )
          `)
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1)

        if (fetchError) {
          throw fetchError
        }

        // Fetch count to determine if there are more transactions
        const { count, error: countError } = await supabase
          .from('transactions')
          .select('id', { count: 'exact' })
          .eq('user_id', session.user.id)

        if (countError) {
          throw countError
        }

        if (!isMounted) return

        // Transform the data to match the Transaction type
        const transformedTransactions: Transaction[] = (transactions as unknown as TransactionWithProject[]).map(t => ({
          id: t.id,
          amount: t.amount,
          type: t.type,
          status: t.status,
          created_at: t.created_at,
          project: t.project ? { name: t.project.name } : null
        }))

        setData(prev => {
          // If it's the first page or no previous data, just return the new transactions
          if (page === 1 || !prev) {
            return {
              transactions: transformedTransactions,
              hasMore: count ? offset + limit < count : false
            }
          }

          // For subsequent pages, combine with previous transactions
          const existingIds = new Set(prev.transactions.map(t => t.id))
          const newUniqueTransactions = transformedTransactions.filter(t => !existingIds.has(t.id))

          return {
            transactions: [...prev.transactions, ...newUniqueTransactions],
            hasMore: count ? offset + limit < count : false
          }
        })
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to fetch transactions'))
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchTransactions()

    return () => {
      isMounted = false
    }
  }, [supabase, limit, page])

  return { data, isLoading, error }
} 