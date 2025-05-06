import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { TeamMember, User } from '@/types'

export interface TeamMemberWithUser extends TeamMember {
  user: User
}

type UserRole = 'partner' | 'admin' | 'investor' | 'viewer' | 'ceo'
type TeamMemberRole = 'lead' | 'member' | 'advisor' | 'consultant'

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
      // 1. Fetch project owner first
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('owner_id')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;

      // 2. Fetch basic team member data
      const { data: membersData, error: membersError } = await supabase
        .from('team_members')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (membersError) throw membersError;

      // Combine owner ID with team member IDs
      const userIds = [
        projectData.owner_id,
        ...(membersData || []).map((member) => member.user_id)
      ].filter((id): id is string => id !== null && id !== undefined);

      let usersData: User[] = [];
      if (userIds.length > 0) {
        // 3. Fetch corresponding users
        const { data: fetchedUsers, error: usersError } = await supabase
          .from('users')
          .select('id, name, email, avatar_url, role, created_at, updated_at')
          .in('id', userIds);

        if (usersError) {
          console.warn("Could not fetch user details:", usersError.message);
        } else {
          usersData = fetchedUsers || [];
        }
      }

      // 4. Create owner team member entry
      const ownerUser = usersData.find(user => user.id === projectData.owner_id);
      const ownerTeamMember: TeamMemberWithUser = {
        id: 'owner-' + projectData.owner_id,
        project_id: projectId,
        user_id: projectData.owner_id,
        role: 'lead' as TeamMemberRole,
        status: 'active',
        joined_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user: ownerUser || {
          id: projectData.owner_id,
          name: 'N/A',
          email: 'N/A',
          avatar_url: null,
          role: 'partner' as UserRole,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      };

      // 5. Combine the data
      const combinedData = [
        ownerTeamMember,
        ...(membersData || []).map((member) => {
          const userDetail = usersData.find((user) => user.id === member.user_id);
          return {
            ...member,
            user: userDetail || {
              id: member.user_id,
              name: 'N/A',
              email: 'N/A',
              avatar_url: null,
              role: 'partner' as UserRole,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          };
        })
      ];

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