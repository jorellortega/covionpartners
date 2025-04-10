import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { TeamMember, User } from '@/types'

export interface TeamMemberWithUser extends TeamMember {
  user: User
}

export function useTeamMembers(projectId: string) {
  const [teamMembers, setTeamMembers] = useState<TeamMemberWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (projectId) {
      fetchTeamMembers()
    }
  }, [projectId])

  const fetchTeamMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          *,
          user:team_members_user_id_fkey(id, email, name)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTeamMembers(data || [])
    } catch (error: any) {
      let errorMessage = 'Failed to fetch team members';
      if (error && typeof error === 'object' && 'message' in error) {
        errorMessage += `: ${error.message}`;
        console.error('Error fetching team members:', error.message, '\nFull Error:', error); 
      } else {
        try {
          const errorString = JSON.stringify(error);
          errorMessage += `: ${errorString}`;
          console.error('Error fetching team members (stringified):', errorString);
        } catch (stringifyError) {
          console.error('Error fetching team members (raw object):', error);
        }
      }
      setError(errorMessage);
    } finally {
      setLoading(false)
    }
  }

  const addTeamMember = async (userId: string, role: TeamMember['role']) => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .insert([{
          project_id: projectId,
          user_id: userId,
          role,
          status: 'active',
          joined_at: new Date().toISOString()
        }])
        .select(`
          *,
          user:team_members_user_id_fkey(id, email, name)
        `)
        .single()

      if (error) throw error
      setTeamMembers((prev) => [data, ...prev])
      return { data, error: null }
    } catch (error) {
      console.error('Error adding team member:', error)
      return { data: null, error }
    }
  }

  const updateTeamMember = async (memberId: string, updates: Partial<TeamMember>) => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .update(updates)
        .eq('id', memberId)
        .select(`
          *,
          user:team_members_user_id_fkey(id, email, name)
        `)
        .single()

      if (error) throw error
      setTeamMembers((prev) =>
        prev.map((member) => (member.id === memberId ? data : member))
      )
      return { data, error: null }
    } catch (error) {
      console.error('Error updating team member:', error)
      return { data: null, error }
    }
  }

  const removeTeamMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId)

      if (error) throw error
      setTeamMembers((prev) => prev.filter((member) => member.id !== memberId))
      return { error: null }
    } catch (error) {
      console.error('Error removing team member:', error)
      return { error }
    }
  }

  return {
    teamMembers,
    loading,
    error,
    addTeamMember,
    updateTeamMember,
    removeTeamMember,
    refreshTeamMembers: fetchTeamMembers,
  }
} 