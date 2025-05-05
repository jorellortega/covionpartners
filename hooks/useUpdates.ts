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
  project_id?: number
  projects?: {
    id: number
    name: string
  }
  user_name?: string
  user_email?: string
  created_by?: string
}

export interface CreateUpdateInput {
  title: string
  description: string
  status: string
  date: string
  category: string
  full_content?: string
  target_roles?: string[]
  created_by?: string
  project_id?: string | null
}

export interface UpdateUpdateInput {
  id: number
  title: string
  description: string
  status: string
  date: string
  category: string
  full_content?: string
  impact?: string[]
  nextSteps?: string[]
  project_id?: number | null
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

        // Get projects where user is owner or team member
        const { data: userProjects } = await supabase
          .from('team_members')
          .select('project_id')
          .eq('user_id', user.id)

        const teamProjectIds = userProjects?.map(p => p.project_id) || []

        // Build the query (no join)
        let query = supabase
          .from('updates')
          .select(`
            *,
            projects (
              id,
              name
            )
          `)
          .order('created_at', { ascending: false })

        // If user is not admin, apply filtering
        if (user.role !== 'admin') {
          query = query.or(
            // Show non-project updates (global updates) that are either public or match user's role
            `and(project_id.is.null,or(target_roles.is.null,target_roles.cs.{${user.role}})),` +
            // Show project updates only for projects user is a member of
            `and(project_id.in.(${teamProjectIds.join(',')}),or(target_roles.is.null,target_roles.cs.{${user.role}}))`
          )
        }

        const { data, error: fetchError } = await query
        console.log('Final query result:', { data, fetchError })

        if (fetchError) {
          throw new Error(`Failed to fetch updates: ${fetchError.message}`)
        }

        // Two-step fetch: get user names for all unique created_by IDs
        const updatesRaw = data || [];
        const userIds = [...new Set(updatesRaw.map(u => u.created_by).filter(Boolean))];
        let userMap: Record<string, string> = {};
        if (userIds.length > 0) {
          const { data: users, error: userError } = await supabase
            .from('users')
            .select('id, name')
            .in('id', userIds);
          if (!userError && users) {
            userMap = Object.fromEntries(users.map(u => [u.id, u.name]));
          }
        }
        setUpdates(updatesRaw.map(update => ({
          ...update,
          user_name: userMap[update.created_by] || update.user_name || 'Unknown User'
        })));
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
      // All authenticated users can create updates

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
      // All authenticated users can update updates

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
      // All authenticated users can delete updates

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
          
          // Get projects where user is owner or team member
          const { data: userProjects } = await supabase
            .from('team_members')
            .select('project_id')
            .eq('user_id', user.id)

          const teamProjectIds = userProjects?.map(p => p.project_id) || []
          
          let query = supabase
            .from('updates')
            .select(`
              *,
              projects (
                id,
                name
              )
            `)
            .order('created_at', { ascending: false })

          // If user is not admin, apply filtering
          if (user.role !== 'admin') {
            query = query.or(
              // Show non-project updates (global updates) that are either public or match user's role
              `and(project_id.is.null,or(target_roles.is.null,target_roles.cs.{${user.role}})),` +
              // Show project updates only for projects user is a member of
              `and(project_id.in.(${teamProjectIds.join(',')}),or(target_roles.is.null,target_roles.cs.{${user.role}}))`
            )
          }

          const { data, error: fetchError } = await query
          console.log('Refresh query result:', { data, fetchError })
          
          if (fetchError) throw new Error(`Failed to fetch updates: ${fetchError.message}`)

          // Two-step fetch: get user names for all unique created_by IDs
          const updatesRaw = data || [];
          const userIds = [...new Set(updatesRaw.map(u => u.created_by).filter(Boolean))];
          let userMap: Record<string, string> = {};
          if (userIds.length > 0) {
            const { data: users, error: userError } = await supabase
              .from('users')
              .select('id, name')
              .in('id', userIds);
            if (!userError && users) {
              userMap = Object.fromEntries(users.map(u => [u.id, u.name]));
            }
          }
          setUpdates(updatesRaw.map(update => ({
            ...update,
            user_name: userMap[update.created_by] || update.user_name || 'Unknown User'
          })));
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