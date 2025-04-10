import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Project } from '@/types'

export function useProjects(userId?: string) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Decide which fetch function to call based on userId
    if (userId) {
      fetchUserProjects() // Fetch projects for a specific user
    } else {
      fetchAllPublicProjects() // Fetch all public projects
    }
  }, [userId])

  // Renamed original function to be specific to user projects
  const fetchUserProjects = async () => {
    if (!userId) { // Should not happen due to useEffect logic, but good check
      setLoading(false)
      return
    }
    
    setLoading(true) // Ensure loading is set
    setError(null)   // Reset error
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
      console.error('Error fetching user projects:', error)
      setError('Failed to fetch user projects: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // New function to fetch only public projects
  const fetchAllPublicProjects = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        // Assuming a 'visibility' column exists
        .eq('visibility', 'public') 
        .order('created_at', { ascending: false })

      if (error) throw error
      setProjects(data || [])
    } catch (error: any) {
      console.error('Error fetching public projects:', error)
      setError('Failed to fetch public projects: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  // --- CRUD Functions (Create, Update, Delete) --- 
  // These might need adjustment if they rely solely on the user-specific project list
  // For now, they likely operate correctly if the user has permission via RLS

  const createProject = async (projectData: Omit<Project, 'id' | 'created_at' | 'updated_at'>) => {
    // This likely needs the userId context, might not make sense for public view
    if (!userId) {
      console.error("Cannot create project without user context.")
      return { data: null, error: new Error("User context required to create project.") }
    }
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([{ ...projectData, owner_id: userId }]) // Requires userId
        .select()
        .single()

      if (error) throw error
      // Optimistically update only if we are viewing user projects
      if (userId) {
         setProjects((prev) => [data, ...prev])
      }
      return { data, error: null }
    } catch (error) {
      console.error('Error creating project:', error)
      return { data: null, error }
    }
  }

  const updateProject = async (projectId: string, updates: Partial<Project>) => {
    // Update should work based on RLS, but optimistic update needs care
    try {
      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', projectId)
        .select()
        .single()

      if (error) throw error
      // Optimistically update the list (works for both public and user views if project is present)
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
    // Delete should work based on RLS, but optimistic update needs care
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)

      if (error) throw error
      // Optimistically update the list (works for both public and user views)
      setProjects((prev) => prev.filter((project) => project.id !== projectId))
      return { error: null }
    } catch (error) {
      console.error('Error deleting project:', error)
      return { error }
    }
  }

  // Determine which refresh function to expose based on context
  const refreshProjects = userId ? fetchUserProjects : fetchAllPublicProjects;

  return {
    projects,
    loading,
    error,
    createProject,
    updateProject,
    deleteProject,
    refreshProjects, // Use the context-aware refresh function
  }
} 