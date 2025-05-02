import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Project, TeamMember, User } from '@/types'

export interface ProjectWithTeam extends Project {
  teamMembers: TeamMember[]
  owner: User
}

export function useUserProjects(userId: string) {
  const [projects, setProjects] = useState<ProjectWithTeam[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (userId) {
      fetchUserProjects()
    }
  }, [userId])

  const fetchUserProjects = async () => {
    setLoading(true)
    setError(null)
    try {
      // First get projects where user is the owner
      const { data: ownedProjects, error: ownedError } = await supabase
        .from('projects')
        .select('*')
        .eq('owner_id', userId)
        .order('created_at', { ascending: false })
      
      if (ownedError) throw ownedError

      // Then get projects where user is a team member
      const { data: teamMemberships, error: teamError } = await supabase
        .from('team_members')
        .select('project_id')
        .eq('user_id', userId)
        .eq('status', 'active')
      
      if (teamError) throw teamError
      
      let memberProjects: Project[] = []
      
      if (teamMemberships && teamMemberships.length > 0) {
        const projectIds = teamMemberships.map(tm => tm.project_id)
        
        const { data: joinedProjects, error: joinedError } = await supabase
          .from('projects')
          .select('*')
          .in('id', projectIds)
          .order('created_at', { ascending: false })
        
        if (joinedError) throw joinedError
        memberProjects = joinedProjects || []
      }

      // Combine and deduplicate projects
      const allProjects = [...(ownedProjects || []), ...memberProjects]
      const uniqueProjects = allProjects.filter((project, index, self) =>
        index === self.findIndex(p => p.id === project.id)
      )

      // Fetch team members and owners for each project
      const projectsWithTeams = await Promise.all(
        uniqueProjects.map(async (project) => {
          // Fetch team members
          const { data: teamMembers, error: teamError } = await supabase
            .from('team_members')
            .select(`
              *,
              user:users(*)
            `)
            .eq('project_id', project.id)
            .order('created_at', { ascending: false })

          if (teamError) {
            console.error('Error fetching team members:', teamError)
            return { ...project, teamMembers: [], owner: null }
          }

          // Fetch project owner
          const { data: owner, error: ownerError } = await supabase
            .from('users')
            .select('*')
            .eq('id', project.owner_id)
            .single()

          if (ownerError) {
            console.error('Error fetching owner:', ownerError)
            return { ...project, teamMembers: teamMembers || [], owner: null }
          }

          return {
            ...project,
            teamMembers: teamMembers || [],
            owner
          }
        })
      )

      setProjects(projectsWithTeams)
    } catch (error: any) {
      console.error('Error fetching user projects:', error)
      setError(error.message || 'Failed to fetch projects')
    } finally {
      setLoading(false)
    }
  }

  const refreshProjects = () => {
    fetchUserProjects()
  }

  return {
    projects,
    loading,
    error,
    refreshProjects
  }
} 