import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

export interface Update {
  id: number
  title: string
  description: string
  status: string
  date: string
  category: string
  full_content?: string
  created_at: string
  updated_at: string
  target_roles?: string[]
}

export interface CreateUpdateInput {
  title: string
  description: string
  status: string
  date: string
  category: string
  full_content?: string
  target_roles?: string[]
}

export interface UpdateUpdateInput extends Partial<CreateUpdateInput> {
  id: number
}

export function useUpdates() {
  const { user } = useAuth()
  const [updates, setUpdates] = useState<Update[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchUpdates() {
      try {
        if (!user) {
          console.log('No user found, waiting for auth state...')
          return
        }

        console.log('Current user:', user)
        console.log('User role:', user.role)

        // First, let's check if we can access the updates table at all
        const { data: testData, error: testError } = await supabase
          .from('updates')
          .select('count')
          .single()

        console.log('Test query result:', { testData, testError })

        // Build the query
        let query = supabase
          .from('updates')
          .select('*')
          .order('created_at', { ascending: false })

        // If user is not admin, filter by target_roles
        if (user.role !== 'admin') {
          // Try a simpler query first - just get all updates
          const { data: allData, error: allError } = await query
          console.log('All updates before filtering:', allData)
          
          // Now add the role filter
          query = query.or('target_roles.is.null,target_roles.cs.{' + user.role + '}')
        }

        const { data, error: fetchError } = await query
        console.log('Final query result:', { data, fetchError })

        if (fetchError) {
          throw new Error(`Failed to fetch updates: ${fetchError.message}`)
        }

        setUpdates(data || [])
      } catch (err) {
        console.error('Error in fetchUpdates:', err)
        setError(err instanceof Error ? err.message : 'Failed to load updates')
      } finally {
        setLoading(false)
      }
    }

    fetchUpdates()
  }, [user])

  const createUpdate = async (input: CreateUpdateInput) => {
    try {
      if (!user) throw new Error('User must be authenticated')
      if (!['partner', 'admin'].includes(user.role)) {
        throw new Error('Only partners and admins can create updates')
      }

      const { data, error: createError } = await supabase
        .from('updates')
        .insert([input])
        .select()
        .single()

      if (createError) throw createError

      setUpdates(prev => [data, ...prev])
      return { data, error: null }
    } catch (err) {
      console.error('Error creating update:', err)
      return { data: null, error: err instanceof Error ? err.message : 'Failed to create update' }
    }
  }

  const updateUpdate = async (input: UpdateUpdateInput) => {
    try {
      if (!user) throw new Error('User must be authenticated')
      if (!['partner', 'admin'].includes(user.role)) {
        throw new Error('Only partners and admins can update updates')
      }

      console.log('Attempting to update update with input:', input)
      console.log('Current user:', user)

      const { id, ...updateData } = input
      const { data, error: updateError } = await supabase
        .from('updates')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      console.log('Update response:', { data, error: updateError })

      if (updateError) {
        console.error('Detailed update error:', {
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint,
          code: updateError.code
        })
        throw updateError
      }

      setUpdates(prev => prev.map(update => 
        update.id === id ? { ...update, ...data } : update
      ))
      return { data, error: null }
    } catch (err) {
      console.error('Error updating update:', err)
      return { data: null, error: err instanceof Error ? err.message : 'Failed to update update' }
    }
  }

  const deleteUpdate = async (id: number) => {
    try {
      if (!user) throw new Error('User must be authenticated')
      if (!['partner', 'admin'].includes(user.role)) {
        throw new Error('Only partners and admins can delete updates')
      }

      const { error: deleteError } = await supabase
        .from('updates')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      setUpdates(prev => prev.filter(update => update.id !== id))
      return { error: null }
    } catch (err) {
      console.error('Error deleting update:', err)
      return { error: err instanceof Error ? err.message : 'Failed to delete update' }
    }
  }

  return {
    updates,
    loading,
    error,
    refreshUpdates: () => {
      setLoading(true)
      setError(null)
      async function fetchUpdates() {
        try {
          if (!user) return
          console.log('Refreshing updates...')
          console.log('Current user:', user)
          
          let query = supabase
            .from('updates')
            .select('*')
            .order('created_at', { ascending: false })

          if (user.role !== 'admin') {
            query = query.or('target_roles.is.null,target_roles.cs.{' + user.role + '}')
          }

          const { data, error: fetchError } = await query
          console.log('Refresh query result:', { data, fetchError })
          
          if (fetchError) throw new Error(`Failed to fetch updates: ${fetchError.message}`)
          setUpdates(data || [])
        } catch (err) {
          console.error('Error in fetchUpdates:', err)
          setError(err instanceof Error ? err.message : 'Failed to load updates')
        } finally {
          setLoading(false)
        }
      }
      fetchUpdates()
    },
    createUpdate,
    updateUpdate,
    deleteUpdate
  }
} 