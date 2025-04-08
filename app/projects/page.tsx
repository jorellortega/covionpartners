"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { DisabledButton } from "@/components/disabled-button"
import {
  Home,
  Briefcase,
  Clock,
  CheckCircle,
  AlertCircle,
  PlusCircle,
  ExternalLink,
  MoreHorizontal,
  DollarSign,
  UserPlus,
  Key,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/status-badge"
import { useProjects } from "@/hooks/useProjects"
import { useAuth } from "@/hooks/useAuth"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"

export default function ProjectsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { projects, loading, error } = useProjects(user?.id || '')
  const [projectKey, setProjectKey] = useState("")
  const [isJoining, setIsJoining] = useState(false)
  const [joinError, setJoinError] = useState("")

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)

      if (error) throw error;

      // Refresh the page to update the projects list
      router.refresh();
      
    } catch (error: any) {
      console.error('Error deleting project:', error);
      alert('Failed to delete project. Please try again.');
    }
  }

  const handleJoinProject = async () => {
    if (!projectKey.trim()) return;
    
    setIsJoining(true)
    setJoinError("")
    
    try {
      // Find the project with this key
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('id')
        .eq('project_key', projectKey.trim())
        .single()

      if (projectError || !projectData) {
        throw new Error('Invalid project key')
      }

      // Add user as team member
      const { error: joinError } = await supabase
        .from('team_members')
        .insert([{
          project_id: projectData.id,
          user_id: user?.id,
          role: 'member',
          status: 'pending',
          joined_at: new Date().toISOString()
        }])

      if (joinError) throw joinError

      // Clear the input and close dialog
      setProjectKey("")
      const dialog = document.querySelector('[data-state="open"]')
      if (dialog) {
        const closeButton = dialog.querySelector('button[aria-label="Close"]')
        closeButton?.click()
      }

      // Show success message
      alert('Join request sent successfully!')
    } catch (error: any) {
      console.error('Error joining project:', error)
      setJoinError(error.message || 'Failed to join project')
    } finally {
      setIsJoining(false)
    }
  }

  // Function to navigate to financials page
  const navigateToFinancials = (projectId?: string) => {
    if (projectId) {
      router.push(`/projects/financials?project=${projectId}`)
    } else {
      router.push("/projects/financials")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-blue-500 border-b-blue-500 border-l-transparent border-r-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-lg">Loading projects...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-red-500">Error loading projects: {error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="leonardo-header">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center text-white hover:text-blue-300 transition-colors mr-4"
            >
              <Home className="w-6 h-6 mr-2" />
              Dashboard
            </Link>
            <h1 className="text-3xl font-bold">Projects</h1>
          </div>
          <div className="flex space-x-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-gray-700 bg-gray-800/30 text-white">
                  <Key className="w-5 h-5 mr-2" />
                  Join Project
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Join a Project</DialogTitle>
                  <DialogDescription>
                    Enter the project key to request access.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Project Key</Label>
                    <Input
                      placeholder="Enter project key (e.g., COV-ABC12)"
                      value={projectKey}
                      onChange={(e) => setProjectKey(e.target.value)}
                    />
                  </div>
                  {joinError && (
                    <div className="text-sm text-red-500">{joinError}</div>
                  )}
                  <Button 
                    className="w-full gradient-button" 
                    onClick={handleJoinProject}
                    disabled={isJoining || !projectKey.trim()}
                  >
                    {isJoining ? 'Requesting Access...' : 'Request to Join'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <DisabledButton icon={<DollarSign className="w-5 h-5 mr-2" />}>
              Financial Dashboard
            </DisabledButton>
            {user && user.role !== 'investor' && (
              <Link href="/projects/new">
                <Button className="gradient-button">
                  <PlusCircle className="w-5 h-5 mr-2" />
                  New Project
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Project Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="leonardo-card p-4 flex items-center">
            <div className="p-3 rounded-full bg-blue-500/20 mr-4">
              <Briefcase className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Projects</p>
              <h3 className="text-2xl font-bold">{projects.length}</h3>
            </div>
          </div>

          <div className="leonardo-card p-4 flex items-center">
            <div className="p-3 rounded-full bg-green-500/20 mr-4">
              <Clock className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Active Projects</p>
              <h3 className="text-2xl font-bold">
                {projects.filter((p) => p.status.toLowerCase() === "active").length}
              </h3>
            </div>
          </div>

          <div className="leonardo-card p-4 flex items-center">
            <div className="p-3 rounded-full bg-yellow-500/20 mr-4">
              <AlertCircle className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Pending</p>
              <h3 className="text-2xl font-bold">
                {projects.filter((p) => p.status.toLowerCase() === "pending").length}
              </h3>
            </div>
          </div>

          <div className="leonardo-card p-4 flex items-center">
            <div className="p-3 rounded-full bg-purple-500/20 mr-4">
              <CheckCircle className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Completed</p>
              <h3 className="text-2xl font-bold">
                {projects.filter((p) => p.status.toLowerCase() === "completed").length}
              </h3>
            </div>
          </div>
        </div>

        {/* Join Project Card */}
        <Card className="mb-8 leonardo-card border-gray-800">
          <CardHeader>
            <CardTitle>Join a Project</CardTitle>
            <CardDescription>Enter a project key to request access to an existing project</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-grow">
                <Input
                  placeholder="Enter project key (e.g., COV-ABC12)"
                  value={projectKey}
                  onChange={(e) => setProjectKey(e.target.value)}
                  className="bg-gray-800/30 border-gray-700"
                />
              </div>
              <Button 
                className="gradient-button" 
                onClick={handleJoinProject}
                disabled={isJoining || !projectKey.trim()}
              >
                {isJoining ? 'Requesting Access...' : 'Request to Join'}
              </Button>
            </div>
            {joinError && (
              <div className="mt-2 text-sm text-red-500">{joinError}</div>
            )}
          </CardContent>
        </Card>

        {/* Projects List */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">All Projects</h2>
            <div className="flex space-x-2">
              <Button variant="outline" className="border-gray-700 bg-gray-800/30 text-white">
                Filter
              </Button>
              <Button variant="outline" className="border-gray-700 bg-gray-800/30 text-white">
                Sort
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card 
                key={project.id} 
                className="leonardo-card border-gray-800 overflow-visible cursor-pointer hover:border-blue-500/50 transition-colors"
                onClick={() => router.push(`/projects/${project.id}`)}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56 bg-gray-900 border-gray-700">
                        <DropdownMenuLabel>Project Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-gray-700" />
                        <DropdownMenuItem 
                          className="text-white hover:bg-gray-800"
                          onClick={() => router.push(`/projects/${project.id}`)}
                        >
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-white hover:bg-gray-800"
                          onClick={() => navigateToFinancials(project.id)}
                        >
                          Financial Breakdown
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-white hover:bg-gray-800"
                          onClick={() => router.push(`/projects/${project.id}?edit=true`)}
                        >
                          Edit Project
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-white hover:bg-gray-800">
                          Generate Report
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-gray-700" />
                        <DropdownMenuItem 
                          className="text-red-400 hover:bg-gray-800 cursor-pointer"
                          onClick={() => handleDeleteProject(project.id)}
                        >
                          Delete Project
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <CardDescription className="text-gray-400 line-clamp-2">
                    {project.description || 'No description available'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <StatusBadge status={project.status} />
                      <span className="text-sm text-gray-400">
                        Budget: {project.budget ? `$${project.budget.toLocaleString()}` : 'Not set'}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Progress</span>
                        <span className="text-white">{project.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                          style={{ width: `${project.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex justify-between text-sm">
                      <div>
                        <span className="text-gray-400">Deadline:</span>
                        <span className="ml-1 text-white">
                          {new Date(project.deadline).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      {project.team_members && project.team_members.length > 0 && (
                        <div>
                          <span className="text-gray-400">Team:</span>
                          <span className="ml-1 text-white">{project.team_members.length} members</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

