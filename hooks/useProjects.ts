import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Project } from '@/types'

export function useProjects(userId?: string) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (userId) {
      fetchProjects()
    }
  }, [userId])

  const fetchProjects = async () => {
    if (!userId) {
      setLoading(false)
      return
    }
    
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
      
      if (teamError) throw teamError
      
      let memberProjects: any[] = []
      
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
      
      // Combine the two sets of projects and remove duplicates
      const allProjects = [...(ownedProjects || []), ...memberProjects]
      const uniqueProjects = allProjects.filter((project, index, self) => 
        index === self.findIndex(p => p.id === project.id)
      )
      
      setProjects(uniqueProjects)
    } catch (error: any) {
      console.error('Error fetching projects:', error)
      setError('Failed to fetch projects: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const createProject = async (projectData: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([{ ...projectData, owner_id: userId }])
        .select()
        .single()

      if (error) throw error
      setProjects((prev) => [data, ...prev])
      return { data, error: null }
    } catch (error) {
      console.error('Error creating project:', error)
      return { data: null, error }
    }
  }

  const updateProject = async (projectId: string, updates: Partial<Project>) => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', projectId)
        .select()
        .single()

      if (error) throw error
      setProjects((prev) =>
        prev.map((project) => (project.id === projectId ? data : project))
      )
      return { data, error: null }
    } catch (error) {
      console.error('Error updating project:', error)
      return { data: null, error }
    }
  }

  const deleteProject = async (projectId: string) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)

      if (error) throw error
      setProjects((prev) => prev.filter((project) => project.id !== projectId))
      return { error: null }
    } catch (error) {
      console.error('Error deleting project:', error)
      return { error }
    }
  }

  return {
    projects,
    loading,
    error,
    createProject,
    updateProject,
    deleteProject,
    refreshProjects: fetchProjects,
  }
} 