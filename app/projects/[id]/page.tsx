"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Building2,
  Calendar,
  DollarSign,
  Users,
  FileText,
  BarChart2,
  Clock,
  Target,
  CheckCircle,
  AlertCircle,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useProjects } from "@/hooks/useProjects"
import { useTeamMembers, TeamMemberWithUser } from "@/hooks/useTeamMembers"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Project, User, TeamMember } from "@/types"
import { supabase } from "@/lib/supabase"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Project status badge component
function StatusBadge({ status }: { status: string }) {
  const getStatusStyles = () => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-500/20 text-green-400 border-green-500/50"
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
      case "completed":
        return "bg-blue-500/20 text-blue-400 border-blue-500/50"
      case "on hold":
        return "bg-orange-500/20 text-orange-400 border-orange-500/50"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/50"
    }
  }

  return (
    <Badge className={`${getStatusStyles()} border`} variant="outline">
      {status}
    </Badge>
  )
}

export default function ProjectDetails() {
  const params = useParams()
  const projectId = params.id as string
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { projects, loading: projectsLoading } = useProjects(user?.id || '')
  const { teamMembers, loading, addTeamMember, updateTeamMember, removeTeamMember, refreshTeamMembers } = useTeamMembers(projectId)
  const [project, setProject] = useState<Project | null>(null)
  const [selectedMember, setSelectedMember] = useState<TeamMemberWithUser | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [availableUsers, setAvailableUsers] = useState<{
    id: string;
    project_id: string;
    user_id: string | null;
    email: string | null;
    role: string;
    status: string;
  }[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [newUserData, setNewUserData] = useState({
    email: '',
    name: '',
    role: ''
  })
  const [isCreatingUser, setIsCreatingUser] = useState(false)

  useEffect(() => {
    refreshTeamMembers()
  }, [projectId])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (!projectsLoading && Array.isArray(projects)) {
      const foundProject = projects.find(p => p?.id === projectId)
      if (foundProject && typeof foundProject === 'object') {
        // Validate that all required fields exist
        if (
          foundProject.name &&
          foundProject.type &&
          foundProject.status &&
          typeof foundProject.progress === 'number' &&
          foundProject.deadline &&
          typeof foundProject.budget === 'number' &&
          typeof foundProject.invested === 'number' &&
          typeof foundProject.roi === 'number' &&
          foundProject.created_at &&
          foundProject.updated_at &&
          foundProject.owner_id
        ) {
        setProject(foundProject)
      } else {
          console.error('Project is missing required fields')
          router.push('/projects')
        }
      } else if (!projectsLoading) {
        router.push('/projects')
      }
    }
  }, [projects, projectId, router, projectsLoading])

  // Fetch available users that can be added to the project
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('team_members')
          .select('*')
          .neq('project_id', projectId) // Exclude members already in this project
          .eq('status', 'active') // Only get active members

        if (error) throw error
        setAvailableUsers(data || [])
      } catch (error) {
        console.error('Error fetching team members:', error)
      }
    }

    if (isAddDialogOpen) {
      fetchUsers()
    }
  }, [isAddDialogOpen, projectId])

  const handleEditMember = (member: TeamMemberWithUser) => {
    setSelectedMember(member)
    setIsEditDialogOpen(true)
  }

  const handleRemoveMember = async (memberId: string) => {
    if (confirm('Are you sure you want to remove this team member?')) {
      const { error } = await removeTeamMember(memberId)
      if (error) {
        console.error('Error removing team member:', error)
        // You might want to show a toast notification here
      }
    }
  }

  const handleAddMember = async () => {
    if (!selectedUserId || !selectedRole) {
      return
    }

    setIsLoading(true)
    try {
      // Get the selected team member
      const selectedMember = availableUsers.find(m => m.id === selectedUserId)
      if (!selectedMember) {
        throw new Error('Selected team member not found')
      }

      // Add the team member to this project
      const { error: teamError } = await supabase
        .from('team_members')
        .insert([{
          project_id: projectId,
          user_id: selectedMember.user_id,
          role: selectedRole,
          status: 'active',
          joined_at: new Date().toISOString()
        }])

      if (teamError) throw teamError
      
      // Refresh team members and reset form
      await refreshTeamMembers()
      setSelectedUserId('')
      setSelectedRole('')
      setIsAddDialogOpen(false)
    } catch (error: any) {
      console.error('Error adding team member:', error)
      alert(error.message || 'Error adding team member')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateUser = async () => {
    if (!newUserData.email || !selectedRole) {
      return
    }

    setIsCreatingUser(true)
    try {
      // Create team member directly with email
      const { error: teamError } = await supabase
        .from('team_members')
        .insert([{
          project_id: projectId,
          user_id: null, // This will be a non-authenticated team member
          email: newUserData.email, // Add the email field
          role: selectedRole,
          status: 'active',
          joined_at: new Date().toISOString()
        }])

      if (teamError) {
        throw new Error(`Error adding team member: ${teamError.message}`)
      }

      // Refresh team members list
      await refreshTeamMembers()

      // Reset form and close dialog
      setNewUserData({ email: '', name: '', role: '' })
      setSelectedRole('')
      setIsAddDialogOpen(false)
    } catch (error: any) {
      console.error('Error creating team member:', error)
      alert(error.message || 'Error creating team member')
    } finally {
      setIsCreatingUser(false)
    }
  }

  // Show loading state while authentication or projects are loading
  if (authLoading || projectsLoading || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  // Show not found state if no project is found after loading
  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Project not found</h2>
          <Button onClick={() => router.push('/projects')} className="gradient-button">
              Back to Projects
          </Button>
        </div>
      </div>
    )
  }

  // Safely format date strings
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString()
    } catch (error) {
      return 'Invalid date'
    }
  }

  // Safely format numbers
  const formatNumber = (num: number) => {
    try {
      return num.toLocaleString()
    } catch (error) {
      return '0'
    }
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="leonardo-header">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <Button 
            variant="ghost" 
            className="text-gray-400 hover:text-white mb-4"
            onClick={() => router.push('/projects')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Projects
          </Button>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-white">{project.name}</h1>
              <p className="text-gray-400 mt-2">{project.description || 'No description available'}</p>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                className="border-gray-700 bg-gray-800/30 text-white hover:bg-gray-800 hover:text-blue-400"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/projects/edit/${projectId}`);
                }}
              >
                <Pencil className="w-4 h-4 mr-2" />
                Edit Project
              </Button>
              <StatusBadge status={project.status || 'Unknown'} />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Project Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Description */}
            <Card className="leonardo-card border-gray-800">
          <CardHeader>
                <CardTitle>Project Description</CardTitle>
                <CardDescription className="text-gray-400">
                  Detailed overview of the project
                </CardDescription>
          </CardHeader>
          <CardContent>
                <div className="prose prose-invert max-w-none">
                  <p className="text-gray-300 leading-relaxed">
                    {project.description || 'No description available.'}
                  </p>
            </div>
          </CardContent>
        </Card>

            {/* Project Overview */}
            <Card className="leonardo-card border-gray-800">
              <CardHeader>
                <CardTitle>Project Overview</CardTitle>
                <CardDescription className="text-gray-400">
                  Key details and progress of the project
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-800/30 rounded-lg">
                      <div className="flex items-center text-gray-400 mb-2">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>Created</span>
                      </div>
                      <div className="text-white font-medium">
                        {formatDate(project.created_at)}
                      </div>
                    </div>
                    <div className="p-4 bg-gray-800/30 rounded-lg">
                      <div className="flex items-center text-gray-400 mb-2">
                        <Clock className="w-4 h-4 mr-2" />
                        <span>Deadline</span>
                      </div>
                      <div className="text-white font-medium">
                        {formatDate(project.deadline)}
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">Progress</span>
                      <span className="text-white">{project.progress || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                        style={{ width: `${project.progress || 0}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-800/30 rounded-lg">
                      <div className="flex items-center text-gray-400 mb-2">
                        <DollarSign className="w-4 h-4 mr-2" />
                        <span>Budget</span>
                      </div>
                      <div className="text-white font-medium">${formatNumber(project.budget)}</div>
                    </div>
                    <div className="p-4 bg-gray-800/30 rounded-lg">
                      <div className="flex items-center text-gray-400 mb-2">
                        <Building2 className="w-4 h-4 mr-2" />
                        <span>Type</span>
                      </div>
                      <div className="text-white font-medium">{project.type || 'Unknown'}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Project Details */}
            <Card className="leonardo-card border-gray-800">
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
                <CardDescription className="text-gray-400">
                  Additional project information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-gray-800/30 rounded-lg">
                    <div className="flex items-center text-gray-400 mb-2">
                      <DollarSign className="w-4 h-4 mr-2" />
                      <span>Investment</span>
                          </div>
                    <div className="text-white font-medium">${formatNumber(project.invested)}</div>
                        </div>
                  <div className="p-4 bg-gray-800/30 rounded-lg">
                    <div className="flex items-center text-gray-400 mb-2">
                      <BarChart2 className="w-4 h-4 mr-2" />
                      <span>ROI</span>
                      </div>
                    <div className="text-white font-medium">{project.roi || 0}%</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Project Stats */}
            <Card className="leonardo-card border-gray-800">
              <CardHeader>
                <CardTitle>Project Stats</CardTitle>
                <CardDescription className="text-gray-400">
                  Key metrics and statistics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-gray-800/30 rounded-lg">
                    <div className="flex items-center text-gray-400 mb-2">
                      <Users className="w-4 h-4 mr-2" />
                      <span>Owner</span>
                    </div>
                    <div className="text-white font-medium">{project.owner_id || 'Unknown'}</div>
                  </div>
                  <div className="p-4 bg-gray-800/30 rounded-lg">
                    <div className="flex items-center text-gray-400 mb-2">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>Last Updated</span>
                    </div>
                    <div className="text-white font-medium">
                      {formatDate(project.updated_at)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Team Members */}
            <Card className="leonardo-card border-gray-800">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Team Members</CardTitle>
                    <CardDescription className="text-gray-400">
                      Project team and collaborators
                    </CardDescription>
                  </div>
                  <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="gradient-button">
                        <Users className="w-4 h-4 mr-2" />
                        Add Member
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Team Member</DialogTitle>
                        <DialogDescription>
                          Add an existing user or create a new one.
                        </DialogDescription>
                      </DialogHeader>
                      <Tabs defaultValue="existing">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="existing">Existing User</TabsTrigger>
                          <TabsTrigger value="new">Create New</TabsTrigger>
                        </TabsList>
                        <TabsContent value="existing" className="space-y-4 py-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-200">
                              Team Member
                            </label>
                            <Select
                              value={selectedUserId}
                              onValueChange={setSelectedUserId}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select team member" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableUsers.map((member) => (
                                  <SelectItem key={member.id} value={member.id}>
                                    {member.email || member.user_id || 'Unknown Member'}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-200">
                              Role
                            </label>
                            <Select
                              value={selectedRole}
                              onValueChange={setSelectedRole}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select role" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="lead">Team Lead</SelectItem>
                                <SelectItem value="member">Team Member</SelectItem>
                                <SelectItem value="advisor">Advisor</SelectItem>
                                <SelectItem value="consultant">Consultant</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Button 
                            className="w-full gradient-button" 
                            onClick={handleAddMember}
                            disabled={isLoading || !selectedUserId || !selectedRole}
                          >
                            {isLoading ? (
                              <>
                                <LoadingSpinner className="w-4 h-4 mr-2" />
                                Adding...
                              </>
                            ) : (
                              <>Add Member</>
                            )}
                          </Button>
                        </TabsContent>
                        <TabsContent value="new" className="space-y-4 py-4">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-200">
                              Name
                            </label>
                            <Input
                              placeholder="Enter name"
                              value={newUserData.name}
                              onChange={(e) => setNewUserData(prev => ({ ...prev, name: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-200">
                              Email
                            </label>
                            <Input
                              type="email"
                              placeholder="Enter email"
                              value={newUserData.email}
                              onChange={(e) => setNewUserData(prev => ({ ...prev, email: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-200">
                              Role
                            </label>
                            <Select
                              value={selectedRole}
                              onValueChange={setSelectedRole}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select role" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="lead">Team Lead</SelectItem>
                                <SelectItem value="member">Team Member</SelectItem>
                                <SelectItem value="advisor">Advisor</SelectItem>
                                <SelectItem value="consultant">Consultant</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Button 
                            className="w-full gradient-button" 
                            onClick={handleCreateUser}
                            disabled={isCreatingUser || !newUserData.email || !newUserData.name || !selectedRole}
                          >
                            {isCreatingUser ? (
                              <>
                                <LoadingSpinner className="w-4 h-4 mr-2" />
                                Creating...
                              </>
                            ) : (
                              <>Create & Add Member</>
                            )}
                          </Button>
                        </TabsContent>
                      </Tabs>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {teamMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg"
                    >
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                          <span className="text-white font-medium">
                            {member.user.name.charAt(0)}
                          </span>
                        </div>
                        <div className="ml-3">
                          <div className="text-white font-medium">
                            {member.user.name}
                          </div>
                        <div className="text-sm text-gray-400">
                            {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditMember(member)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMember(member.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {!loading && teamMembers.length === 0 && (
                    <div className="text-center py-6">
                      <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-400">
                        No team members yet
                      </h3>
                      <p className="text-gray-500 mt-1">
                        Add team members to collaborate on this project
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="leonardo-card border-gray-800">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription className="text-gray-400">
                  Common project actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button className="w-full gradient-button">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Update Progress
                  </Button>
                  <Button className="w-full gradient-button">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Report Issue
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

