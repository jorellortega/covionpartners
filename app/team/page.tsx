"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "../../hooks/useAuth"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Search, UserPlus, AlertCircle, Users } from "lucide-react"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"

interface TeamMember {
  id: string
  user_id: string
  project_id: string
  project_role: string
  status: string
  joined_at: string
  user: {
    id: string
    email: string
    full_name: string
    avatar_url: string | null
  }
}

interface Project {
  id: string
  name: string
}

interface Membership {
  project_id: string
  projects: Project | null
}

export default function TeamPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [memberFilter, setMemberFilter] = useState<'all' | 'active' | 'pending'>('all')

  useEffect(() => {
    console.log('Auth state:', { user, authLoading })
    if (authLoading) {
      console.log('Auth is still loading...')
      return
    }

    if (user) {
      console.log('User is authenticated:', user)
      fetchUserProjects()
    } else {
      console.log('No user found, redirecting to login...')
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

      const { data: memberships, error: membershipError } = await supabase
        .from("team_members")
        .select(`
          project_id,
          projects:project_id (
            id,
            name
          )
        `)
        .eq("user_id", user.id)
        .returns<Membership[]>()

      if (membershipError) {
        console.error("Error fetching memberships:", membershipError)
        setError("Failed to load your projects")
        return
      }

      if (!memberships || memberships.length === 0) {
        setError("You are not a member of any projects")
        setLoading(false)
        return
      }

      const projectsData = memberships
        .map((m) => m.projects)
        .filter((p): p is Project => p !== null)

      setProjects(projectsData)
      if (projectsData.length > 0) {
        setSelectedProject(projectsData[0].id)
      }
    } catch (err) {
      console.error("Error in fetchUserProjects:", err)
      setError("Failed to load projects")
    } finally {
      setLoading(false)
    }
  }

  const fetchProjectTeamMembers = async () => {
    if (!selectedProject) return

    try {
      console.log('Fetching team members for project:', selectedProject)
      
      // First, let's verify we can access the team_members table
      const { data: testData, error: testError } = await supabase
        .from('team_members')
        .select('count')
        .eq('project_id', selectedProject)
        .single()

      console.log('Test query result:', { testData, testError })

      if (testError) {
        console.error('Error accessing team_members:', testError)
        throw testError
      }

      // Fetch team members
      const { data: members, error: membersError } = await supabase
        .from('team_members')
        .select('*')
        .eq('project_id', selectedProject)

      console.log('Team members query result:', { members, membersError })

      if (membersError) {
        console.error('Detailed error fetching team members:', {
          message: membersError.message,
          details: membersError.details,
          hint: membersError.hint,
          code: membersError.code
        })
        setError(`Failed to load team members: ${membersError.message}`)
        return
      }

      if (!members || members.length === 0) {
        console.log('No team members found for project')
        setTeamMembers([])
        setError(null)
        return
      }

      // Fetch user data for all team members
      const userIds = members.map(member => member.user_id)
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .in('id', userIds)

      if (usersError) {
        console.error('Error fetching user data:', usersError)
        setError('Failed to load user details')
        return
      }

      // Combine team members with user data
      const teamMembersWithUsers = members.map(member => {
        const user = users?.find(u => u.id === member.user_id)
        return {
          ...member,
          user: user ? {
            id: user.id,
            email: user.email,
            full_name: user.full_name || user.name || 'Unknown User',
            avatar_url: user.avatar_url
          } : {
            id: member.user_id,
            email: 'Unknown',
            full_name: 'Unknown User',
            avatar_url: null
          }
        }
      })

      setTeamMembers(teamMembersWithUsers)
      setError(null)
    } catch (err) {
      console.error('Error in fetchProjectTeamMembers:', err)
      setError('Failed to load team members. Please try again later.')
    }
  }

  const filteredTeamMembers = teamMembers.filter(member => {
    if (memberFilter === 'all') return true
    return member.status === memberFilter
  })

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Team Members</h1>
          <p className="text-sm sm:text-base text-gray-400">Manage and view your team members</p>
        </header>

        <div className="space-y-4">
          <Button onClick={() => router.push('/')} className="gradient-button w-full sm:w-auto">
            Home
          </Button>

          {/* Project Selection */}
          <Card className="mb-6 border-gray-800 bg-gray-900">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="w-full sm:w-auto">
                  <Label className="text-white mb-2 block">Select Project</Label>
                  <Select
                    value={selectedProject || ''}
                    onValueChange={setSelectedProject}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {selectedProject ? projects.find(p => p.id === selectedProject)?.name : "Choose a project"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map(project => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full sm:w-auto">
                  <Label className="text-white mb-2 block">Filter Members</Label>
                  <Select
                    value={memberFilter}
                    onValueChange={(value: 'all' | 'active' | 'pending') => setMemberFilter(value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {memberFilter === 'all' ? 'All Members' : 
                         memberFilter === 'active' ? 'Active Members' : 'Pending Members'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Members</SelectItem>
                      <SelectItem value="active">Active Members</SelectItem>
                      <SelectItem value="pending">Pending Members</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <Card className="border-red-500/50 bg-red-500/10">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-red-400">
                  <AlertCircle className="w-5 h-5" />
                  <p>{error}</p>
                </div>
              </CardContent>
            </Card>
          ) : !selectedProject ? (
            <Card className="border-gray-800 bg-gray-900">
              <CardContent className="p-8 text-center">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Select a Project</h3>
                <p className="text-gray-400 mb-4">Choose a project to view its team members</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredTeamMembers.map(member => (
                <Card key={member.id} className="border-gray-800 bg-gray-900">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-white">{member.user.full_name}</h3>
                        <p className="text-sm text-gray-400">{member.user.email}</p>
                        <div className="mt-2 flex gap-2">
                          <Badge variant="secondary">{member.project_role}</Badge>
                          <Badge 
                            variant={member.status === 'active' ? 'default' : 'outline'}
                            className={member.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' : ''}
                          >
                            {member.status}
                          </Badge>
                        </div>
                        <p className="mt-2 text-sm text-gray-400">
                          Joined: {new Date(member.joined_at).toLocaleDateString()}
                        </p>
                      </div>
                      {member.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Add functionality to approve/reject pending members
                              toast.info('Member approval functionality coming soon')
                            }}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Add functionality to reject pending members
                              toast.info('Member rejection functionality coming soon')
                            }}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredTeamMembers.length === 0 && (
                <Card className="border-gray-800 bg-gray-900">
                  <CardContent className="p-8 text-center">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No Team Members</h3>
                    <p className="text-gray-400">
                      {memberFilter === 'all' ? "This project doesn't have any team members yet." :
                       memberFilter === 'active' ? "No active team members found." :
                       "No pending team members found."}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 