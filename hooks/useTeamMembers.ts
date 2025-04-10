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
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch basic team member data
      const { data: membersData, error: membersError } = await supabase
        .from('team_members')
        .select('*') // Select all columns from team_members
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (membersError) throw membersError;
      if (!membersData) {
        setTeamMembers([]);
        setLoading(false);
        return;
      }

      // Extract user IDs, filtering out any null/undefined IDs
      const userIds = membersData
        .map((member) => member.user_id)
        .filter((id): id is string => id !== null && id !== undefined);

      let usersData: User[] = [];
      if (userIds.length > 0) {
        // 2. Fetch corresponding users from auth.users
        const { data: fetchedUsers, error: usersError } = await supabase
          .from('users') // Explicitly target the public.users table IF it exists and is intended
          // If you mean auth.users, adjust this line:
          // .schema('auth') 
          // .from('users')
          .select('id, name, email') // Adjust columns as needed from your users table
          .in('id', userIds);

        if (usersError) {
           console.warn("Could not fetch user details:", usersError.message);
           // Proceed without user details if fetch fails, or throw error if essential
           // throw usersError; 
        } else {
          usersData = fetchedUsers || [];
        }
      }

      // 3. Combine the data
      const combinedData = membersData.map((member) => {
        const userDetail = usersData.find((user) => user.id === member.user_id);
        return {
          ...member,
          // Ensure the user property matches the TeamMemberWithUser interface
          user: userDetail || { id: member.user_id, name: 'N/A', email: 'N/A' } // Provide default user structure if not found
        };
      });

      setTeamMembers(combinedData);

    } catch (error: any) {
      let errorMessage = 'Failed to fetch team members or user details';
      if (error && typeof error === 'object' && 'message' in error) {
        errorMessage += `: ${error.message}`;
        console.error('Error fetching team members/users:', error.message, '\nFull Error:', error);
      } else {
        try {
          const errorString = JSON.stringify(error);
          errorMessage += `: ${errorString}`;
          console.error('Error fetching team members/users (stringified):', errorString);
        } catch (stringifyError) {
          console.error('Error fetching team members/users (raw object):', error);
        }
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

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
          user:users(*)
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
          user:users(*)
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