import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

export function useDeals() {
  const [deals, setDeals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    const fetchDeals = async () => {
      if (!user?.id) {
        setDeals([])
        setLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('deals')
          .select(`
            *,
            participants:deal_participants(
              id,
              status,
              role,
              user:users(
                id,
                name,
                email,
                avatar_url
              )
            )
          `)
          .order('created_at', { ascending: false })

        if (error) throw error

        // Filter deals where user is initiator or participant
        const filteredDeals = (data || []).filter((deal) => {
          // User is the initiator
          if (deal.initiator_id === user.id) {
            return true
          }
          
          // User is a participant
          if (deal.participants && deal.participants.length > 0) {
            return deal.participants.some((participant: any) => 
              participant.user && participant.user.id === user.id
            )
          }
          
          return false
        })

        setDeals(filteredDeals)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchDeals()
  }, [user?.id])

  return { deals, loading, error }
} 