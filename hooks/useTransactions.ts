import { useQuery } from '@tanstack/react-query'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export type Transaction = {
  id: string
  amount: number
  type: string
  status: string
  user_id: string
  project_id: string | null
  created_at: string
  // Join fields
  user?: {
    email: string
    name: string
  }
  project?: {
    name: string
  }
}

type TransactionsResponse = {
  transactions: Transaction[]
  total: number
  hasMore: boolean
  currentPage: number
}

type UseTransactionsOptions = {
  status?: string
  type?: string
  userId?: string
  projectId?: string
  startDate?: Date
  endDate?: Date
  page?: number
  limit?: number
}

export function useTransactions(options: UseTransactionsOptions = {}) {
  const supabase = createClientComponentClient()
  const {
    status,
    type,
    userId,
    projectId,
    startDate,
    endDate,
    page = 1,
    limit = 10
  } = options

  const query = useQuery<TransactionsResponse, Error>({
    queryKey: ['transactions', options],
    queryFn: async () => {
      let query = supabase
        .from('transactions')
        .select(`
          *,
          project:projects(name)
        `, { count: 'exact' })
        
      // Apply filters
      if (status) {
        query = query.eq('status', status)
      }
      if (type) {
        query = query.eq('type', type)
      }
      if (userId) {
        query = query.eq('user_id', userId)
      }
      if (projectId) {
        query = query.eq('project_id', projectId)
      }
      if (startDate) {
        query = query.gte('created_at', startDate.toISOString())
      }
      if (endDate) {
        query = query.lte('created_at', endDate.toISOString())
      }

      // Add pagination
      const from = (page - 1) * limit
      const to = from + (limit - 1)
      query = query.range(from, to)
      .order('created_at', { ascending: false })
      .limit(limit) // Add explicit limit to ensure we don't get more than requested

      const { data, error, count } = await query

      if (error) {
        throw error
      }

      // Get user details separately since we can't join directly with auth.users
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(t => t.user_id))]
        const { data: users } = await supabase
          .from('users')
          .select('id, email, name')
          .in('id', userIds)

        const userMap = users?.reduce((acc, user) => {
          acc[user.id] = user
          return acc
        }, {} as Record<string, any>) || {}

        data.forEach(transaction => {
          transaction.user = userMap[transaction.user_id]
        })
      }

      return {
        transactions: data as Transaction[],
        total: count || 0,
        hasMore: count ? from + data.length < count : false,
        currentPage: page
      }
    },
    staleTime: 5000,
    refetchOnWindowFocus: false
  })

  const defaultData: TransactionsResponse = {
    transactions: [],
    total: 0,
    hasMore: false,
    currentPage: 1
  }

  return {
    ...query,
    data: query.data || defaultData
  }
} 