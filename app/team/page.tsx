"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Search, UserPlus, AlertCircle, Users, Mail } from "lucide-react"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"
import { Project, TeamMember, User } from "@/types"

interface TeamMemberWithUser extends TeamMember {
  user: User
}

interface Membership {
  project_id: string
  projects: Project | null
}

export default function TeamPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [teamMembers, setTeamMembers] = useState<TeamMemberWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [memberFilter, setMemberFilter] = useState<'all' | 'active' | 'pending'>('all')

  useEffect(() => {
    if (authLoading) return
    if (user) {
      fetchUserProjects()
    } else {
      setLoading(false)
      setError("Please sign in to view team members")
      router.push('/login')
    }
  }, [user, authLoading])

  useEffect(() => {
    if (selectedProject) {
      fetchProjectTeamMembers()
    }
  }, [selectedProject])

  const fetchUserProjects = async () => {
    try {
      if (!user?.id) {
        setError("Please sign in to view projects")
        setLoading(false)
        return
      }

      // First get projects where user is the owner
      const { data: ownedProjects, error: ownedError } = await supabase
        .from('projects')
        .select('*')
        .eq('owner_id', user.id)
        .order('name')

      if (ownedError) {
        console.error('Error fetching owned projects:', ownedError)
        throw ownedError
      }

      // Then get projects where user is a team member
      const { data: teamMemberships, error: teamError } = await supabase
        .from('team_members')
        .select('project_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
      
      if (teamError) {
        console.error('Error fetching team memberships:', teamError)
        throw teamError
      }
      
      let memberProjects: Project[] = []
      
      if (teamMemberships && teamMemberships.length > 0) {
        const projectIds = teamMemberships.map(tm => tm.project_id)
        
        const { data: joinedProjects, error: joinedError } = await supabase
          .from('projects')
          .select('*')
          .in('id', projectIds)
          .order('name')
        
        if (joinedError) {
          console.error('Error fetching joined projects:', joinedError)
          throw joinedError
        }

        if (joinedProjects) {
          memberProjects = joinedProjects
        }
      }

      // Get owner details for all projects
      const allProjects = [...(ownedProjects || []), ...memberProjects]
      const uniqueProjects = allProjects.filter((project, index, self) =>
        index === self.findIndex(p => p.id === project.id)
      )

      if (uniqueProjects.length === 0) {
        console.log('No projects found for user:', user.id)
        setError("You don't have access to any projects")
        setProjects([])
        setSelectedProject(null)
      } else {
        // Get owner details for all projects
        const ownerIds = [...new Set(uniqueProjects.map(p => p.owner_id))]
        const { data: owners, error: ownersError } = await supabase
          .from('users')
          .select('id, name, email')
          .in('id', ownerIds)

        if (ownersError) {
          console.error('Error fetching project owners:', ownersError)
        } else if (owners) {
          // Add owner details to projects
          const projectsWithOwners = uniqueProjects.map(project => ({
            ...project,
            owner: owners.find(o => o.id === project.owner_id) || null
          }))
          setProjects(projectsWithOwners)
          if (!selectedProject) {
            setSelectedProject(projectsWithOwners[0].id)
          }
        } else {
          setProjects(uniqueProjects)
          if (!selectedProject) {
            setSelectedProject(uniqueProjects[0].id)
          }
        }
      }
    } catch (err: any) {
      console.error("Error in fetchUserProjects:", err)
      if (err.message) {
        console.error("Error message:", err.message)
      }
      if (err.details) {
        console.error("Error details:", err.details)
      }
      toast.error("Failed to load projects")
      setError("Failed to load projects")
      setProjects([])
      setSelectedProject(null)
    } finally {
      setLoading(false)
    }
  }

  const fetchProjectTeamMembers = async () => {
    if (!selectedProject) return

    try {
      setLoading(true)
      setError(null)

      // 1. Fetch basic team member data
      const { data: membersData, error: membersError } = await supabase
        .from('team_members')
        .select('*')
        .eq('project_id', selectedProject)
        .order('created_at', { ascending: false })

      if (membersError) throw membersError
      if (!membersData) {
        setTeamMembers([])
        return
      }

      // Extract user IDs
      const userIds = membersData
        .map((member) => member.user_id)
        .filter((id): id is string => !!id)

      // Also get the project owner ID
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('owner_id')
        .eq('id', selectedProject)
        .single()

      if (projectError) {
        console.warn('Could not fetch project owner:', projectError.message)
      } else if (projectData?.owner_id && !userIds.includes(projectData.owner_id)) {
        userIds.push(projectData.owner_id)
      }

      let usersData: User[] = []
      if (userIds.length > 0) {
        // 2. Fetch corresponding users
        const { data: fetchedUsers, error: usersError } = await supabase
          .from('users')
          .select('id, name, email, avatar_url, role, created_at, updated_at')
          .in('id', userIds)

        if (usersError) {
          console.warn("Could not fetch user details:", usersError.message)
        } else {
          usersData = fetchedUsers || []
        }
      }

      // 3. Combine the data
      const combinedData = membersData.map((member) => {
        const userDetail = usersData.find((u) => u.id === member.user_id)
        return {
          ...member,
          user: userDetail || { 
            id: member.user_id, 
            name: 'Unknown User', 
            email: 'Unknown',
            role: 'viewer' as const,
            created_at: member.created_at,
            updated_at: member.updated_at,
            avatar_url: null
          }
        }
      })

      // Add owner if they weren't in team_members
      if (projectData?.owner_id && !membersData.some(m => m.user_id === projectData.owner_id)) {
        const ownerDetail = usersData.find(u => u.id === projectData.owner_id)
        if (ownerDetail) {
          combinedData.unshift({
            id: '0-owner',
            user_id: projectData.owner_id,
            project_id: selectedProject,
            role: 'owner' as const,
            status: 'active' as const,
            joined_at: '',
            created_at: '',
            updated_at: '',
            user: ownerDetail
          })
        }
      }

      setTeamMembers(combinedData)
    } catch (error: any) {
      console.error('Error fetching team members:', error)
      toast.error('Failed to load team members')
      setError('Failed to load team members')
    } finally {
      setLoading(false)
    }
  }

  const filteredTeamMembers = teamMembers.filter(member => {
    const matchesSearch = searchQuery === "" || 
      member.user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.user.email?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesFilter = memberFilter === 'all' || 
      (memberFilter === 'active' && member.status === 'active') ||
      (memberFilter === 'pending' && member.status === 'inactive')
    
    return matchesSearch && matchesFilter
  })

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-red-500 mb-2">Error</h1>
        <p className="text-gray-400 text-center mb-4">{error}</p>
        <Button onClick={() => router.push('/projects')} variant="outline">
          Go to Projects
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Team Members</h1>
            <p className="text-gray-400 mt-1">Manage your project team members</p>
          </div>
          <Button
            onClick={() => router.push(`/projects/${selectedProject}/team/invite`)}
            className="bg-purple-600 hover:bg-purple-700"
            disabled={!selectedProject}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Member
          </Button>
        </div>

        <Card className="leonardo-card border-gray-800 mb-6">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="project-select">Project</Label>
                <Select
                  value={selectedProject || ""}
                  onValueChange={setSelectedProject}
                >
                  <SelectTrigger id="project-select" className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label htmlFor="member-filter">Filter</Label>
                <Select
                  value={memberFilter}
                  onValueChange={(value: 'all' | 'active' | 'pending') => setMemberFilter(value)}
                >
                  <SelectTrigger id="member-filter" className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue placeholder="Filter members" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Members</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    type="text"
                    placeholder="Search members..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-gray-800 border-gray-700 text-white"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeamMembers.length === 0 ? (
            <Card className="col-span-full bg-gray-900/50 border-gray-800">
              <CardContent className="p-12 text-center">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-200 mb-2">No team members found</h3>
                <p className="text-gray-400 mb-4">
                  {selectedProject
                    ? "Try adjusting your search or filter settings"
                    : "Select a project to view team members"}
                </p>
                {selectedProject && (
                  <Button
                    onClick={() => router.push(`/projects/${selectedProject}/team/invite`)}
                    variant="outline"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invite Member
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            filteredTeamMembers.map((member) => (
              <Card key={member.id} className="bg-gray-900/50 border-gray-800">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={member.user.avatar_url || undefined} />
                      <AvatarFallback>
                        {member.user.name?.split(' ').map(n => n[0]).join('') || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {member.user.name || 'Unknown User'}
                      </p>
                      <Badge 
                        variant={member.status === 'active' ? 'default' : 'secondary'}
                        className="mt-1"
                      >
                        {member.role}
                      </Badge>
                      <div className="mt-2 flex flex-col space-y-1">
                        <a
                          href={`mailto:${member.user.email}`}
                          className="flex items-center text-sm text-gray-400 hover:text-white"
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          {member.user.email}
                        </a>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  )
} 