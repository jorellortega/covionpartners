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
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

export default function ProjectsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { projects, loading, error } = useProjects(user?.id || '')
  const [projectKey, setProjectKey] = useState("")
  const [isJoining, setIsJoining] = useState(false)
  const [joinError, setJoinError] = useState("")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null)
  const [searchStatus, setSearchStatus] = useState<"idle" | "searching" | "found" | "not_found">("idle")
  const [foundProject, setFoundProject] = useState<any>(null)

  const handleDeleteProject = async (projectId: string) => {
    setProjectToDelete(projectId)
    setIsDeleteDialogOpen(true)
  }
  
  const confirmDelete = async () => {
    if (!projectToDelete) return
    
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectToDelete)

      if (error) throw error;

      // Refresh the page to update the projects list
      router.refresh();
      toast.success("Project deleted successfully")
      
    } catch (error: any) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project. Please try again.');
    } finally {
      setIsDeleteDialogOpen(false)
      setProjectToDelete(null)
    }
  }

  const handleJoinProject = async () => {
    if (!projectKey.trim()) return;
    
    const trimmedKey = projectKey.trim();
    console.log('Attempting to join project with key:', trimmedKey);
    setIsJoining(true)
    setJoinError("")
    setSearchStatus("searching")
    setFoundProject(null)
    
    try {
      // Get all projects to check for direct string comparison
      const { data: allProjects, error: listError } = await supabase
        .from('projects')
        .select('id, project_key, name, owner_id')
        .limit(50)
      
      console.log('Available project keys:', allProjects?.map(p => ({ 
        id: p.id, 
        key: p.project_key,
        keyType: typeof p.project_key,
        keyLength: p.project_key?.length,
        // Compare keys character by character
        matches: p.project_key === trimmedKey,
        // Compare lowercase
        matchesLower: p.project_key?.toLowerCase() === trimmedKey.toLowerCase()
      })));
      
      if (listError) {
        console.error('Error listing projects:', listError);
      }
      
      // Try to find the project by direct comparison in the returned data
      const matchedProject = allProjects?.find(p => 
        p.project_key?.toLowerCase() === trimmedKey.toLowerCase()
      );
      
      if (matchedProject) {
        console.log('Found project by direct comparison:', matchedProject);
        setSearchStatus("found")
        setFoundProject(matchedProject)
        
        // Check if user is already a team member
        const { data: existingMember, error: checkError } = await supabase
          .from('team_members')
          .select('id, status')
          .eq('project_id', matchedProject.id)
          .eq('user_id', user?.id)
          .single()

        if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
          console.error('Check member error:', checkError);
          throw checkError
        }

        if (existingMember) {
          if (existingMember.status === 'pending') {
            throw new Error('Your join request is still pending approval')
          } else {
            throw new Error('You are already a member of this project')
          }
        }

        // Add user as team member
        const { data: newMember, error: joinError } = await supabase
          .from('team_members')
          .insert([{
            project_id: matchedProject.id,
            user_id: user?.id,
            role: 'member',
            status: 'pending',
            joined_at: new Date().toISOString()
          }])
          .select()

        if (joinError) {
          console.error('Join error:', joinError);
          throw joinError
        }
        
        // Get user details for the notification
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', user?.id)
          .single()
          
        if (userError) {
          console.error('Error getting user profile:', userError);
        }
        
        // Create notification for project owner
        await supabase
          .from('notifications')
          .insert([{
            user_id: matchedProject.owner_id,
            type: 'join_request',
            title: 'New Join Request',
            content: `${userData?.full_name || 'Someone'} has requested to join your project: ${matchedProject.name}`,
            metadata: JSON.stringify({
              project_id: matchedProject.id,
              project_name: matchedProject.name,
              user_id: user?.id,
              user_name: userData?.full_name,
              user_email: userData?.email,
              team_member_id: newMember?.[0]?.id
            }),
            read: false,
            created_at: new Date().toISOString()
          }])
          .select()
          .then(({ data, error }) => {
            if (error) console.error('Error creating notification:', error);
            console.log('Notification created:', data);
          });

        // Clear the input and close dialog
        setProjectKey("")
        const dialog = document.querySelector('[data-state="open"]')
        if (dialog) {
          const closeButton = dialog.querySelector('button[aria-label="Close"]')
          closeButton?.click()
        }

        // Show success message using toast
        toast.success('Join request sent successfully! Project owner will be notified.')
        
        // Refresh the page to update the projects list
        router.refresh()
        return;
      }
      
      // If not found by direct comparison, try the regular way
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('id, project_key, name')
        .or(`project_key.eq.${trimmedKey},project_key.ilike.${trimmedKey}`)
        .single()

      console.log('Query response:', { data: projectData, error: projectError });

      if (projectError) {
        console.error('Project key error:', projectError);
        console.log('Project query details:', {
          key: trimmedKey,
          query: 'eq or ilike',
          error: projectError
        });
        setSearchStatus("not_found")
        throw new Error('Invalid project key')
      }
      
      if (!projectData) {
        console.log('No project found with key:', trimmedKey);
        setSearchStatus("not_found")
        throw new Error('Invalid project key')
      }
      
      setSearchStatus("found")
      setFoundProject(projectData)
      console.log('Found project:', projectData);

      // Check if user is already a team member
      const { data: existingMember, error: checkError } = await supabase
        .from('team_members')
        .select('id')
        .eq('project_id', projectData.id)
        .eq('user_id', user?.id)
        .single()

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Check member error:', checkError);
        throw checkError
      }

      if (existingMember) {
        throw new Error('You are already a member of this project')
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

      if (joinError) {
        console.error('Join error:', joinError);
        throw joinError
      }

      // Clear the input and close dialog
      setProjectKey("")
      const dialog = document.querySelector('[data-state="open"]')
      if (dialog) {
        const closeButton = dialog.querySelector('button[aria-label="Close"]')
        closeButton?.click()
      }

      // Show success message using toast
      toast.success('Join request sent successfully!')
      
      // Refresh the page to update the projects list
      router.refresh()
    } catch (error: any) {
      console.error('Error joining project:', error)
      setJoinError(error.message || 'Failed to join project')
      toast.error(error.message || 'Failed to join project')
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
      <header className="leonardo-header sticky top-0 z-10 bg-gray-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center text-white hover:text-blue-300 transition-colors mr-4"
            >
              <Home className="w-6 h-6 mr-2" />
              Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-white">Projects</h1>
          </div>
          {/* Buttons removed from header */}
        </div>
      </header>

      {/* Main content area */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Buttons MOVED to here, inside main */}
        <div className="flex justify-end items-center gap-3 mb-6">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-gray-700 bg-gray-800/30 text-white hover:bg-purple-100 hover:text-purple-600 dark:hover:bg-purple-900/20 dark:hover:text-purple-400">
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
                
                {/* Debug button */}
                <div className="text-xs text-gray-500 mt-1">
                  <Button
                    variant="link"
                    className="h-auto p-0 text-xs text-gray-500"
                    onClick={async () => {
                      try {
                        console.log('Testing Supabase connection...');
                        const { data, error } = await supabase
                          .from('projects')
                          .select('count()')
                        console.log('Connection result:', { data, error });
                        toast.info('Check browser console for connection details');
                      } catch (err) {
                        console.error('Connection test error:', err);
                        toast.error('Connection test failed - see console');
                      }
                    }}
                  >
                    Test DB Connection
                  </Button>
                </div>
                
                {/* Search Status Indicator */}
                {searchStatus === "searching" && (
                  <div className="p-3 border border-gray-700 rounded-md bg-gray-800/50">
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-t-blue-500 border-b-blue-500 border-l-transparent border-r-transparent rounded-full animate-spin mr-2"></div>
                      <p className="text-sm text-gray-300">Searching for project...</p>
                    </div>
                  </div>
                )}
                
                {searchStatus === "found" && foundProject && (
                  <div className="p-3 border border-green-800 rounded-md bg-green-900/20">
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      <p className="text-sm text-green-400">Project found: {foundProject.name}</p>
                    </div>
                  </div>
                )}
                
                {searchStatus === "not_found" && (
                  <div className="p-3 border border-red-800 rounded-md bg-red-900/20">
                    <div className="flex items-center">
                      <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
                      <p className="text-sm text-red-400">Project not found. Check the key and try again.</p>
                    </div>
                  </div>
                )}
                
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
          {user && user.role !== 'investor' && (
            <Link href="/projects/new">
              <Button className="gradient-button">
                <PlusCircle className="w-5 h-5 mr-2" />
                New Project
              </Button>
            </Link>
          )}
        </div>

        {/* Project Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
           {/* Stats cards remain here */}
             <div className="leonardo-card p-4 flex items-center">
              <div className="p-3 rounded-full bg-blue-500/20 mr-4">
                <Briefcase className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Projects</p>
                <h3 className="text-2xl font-bold text-white">{projects.length}</h3>
              </div>
            </div>

            <div className="leonardo-card p-4 flex items-center">
              <div className="p-3 rounded-full bg-green-500/20 mr-4">
                <Clock className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Active Projects</p>
                <h3 className="text-2xl font-bold text-white">
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
                <h3 className="text-2xl font-bold text-white">
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
                <h3 className="text-2xl font-bold text-white">
                  {projects.filter((p) => p.status.toLowerCase() === "completed").length}
                </h3>
              </div>
            </div>
        </div>

        {/* Projects List */}
        <div className="space-y-6">
           {/* List rendering remains here */}
           <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">All Projects</h2>
            <div className="flex space-x-2">
              <Button variant="outline" className="border-gray-700 bg-gray-800/30 text-white hover:bg-purple-100 hover:text-purple-600 dark:hover:bg-purple-900/20 dark:hover:text-purple-400">
                Filter
              </Button>
              <Button variant="outline" className="border-gray-700 bg-gray-800/30 text-white hover:bg-purple-100 hover:text-purple-600 dark:hover:bg-purple-900/20 dark:hover:text-purple-400">
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
                        <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-purple-100 hover:text-purple-600 dark:hover:bg-purple-900/20 dark:hover:text-purple-400">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56 bg-gray-900 border-gray-700">
                        <DropdownMenuLabel>Project Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-gray-700" />
                        <DropdownMenuItem 
                          className="text-white hover:bg-purple-100 hover:text-purple-600 dark:hover:bg-purple-900/20 dark:hover:text-purple-400"
                          onClick={() => router.push(`/projects/${project.id}`)}
                        >
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-white hover:bg-purple-100 hover:text-purple-600 dark:hover:bg-purple-900/20 dark:hover:text-purple-400"
                          onClick={() => router.push(`/projects/${project.id}?edit=true`)}
                        >
                          Edit Project
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-gray-700" />
                        <DropdownMenuItem 
                          className="text-red-400 hover:bg-purple-100 hover:text-purple-600 dark:hover:bg-purple-900/20 dark:hover:text-purple-400 cursor-pointer"
                          onClick={() => {
                            setProjectToDelete(project.id);
                            setIsDeleteDialogOpen(true);
                          }}
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

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="leonardo-card border-gray-800">
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription className="text-gray-400">
                Are you sure you want to delete this project? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="pt-4">
              <Button
                variant="outline"
                className="border-gray-700 bg-gray-800/30 text-white hover:bg-gray-800/50"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                className="bg-purple-600 hover:bg-purple-700 text-white"
                onClick={confirmDelete}
              >
                Delete Project
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}

