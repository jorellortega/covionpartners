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
  Plus,
  PauseCircle,
  Search,
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
  const { user, loading: authLoading } = useAuth()
  const { projects, loading, error, deleteProject } = useProjects(user?.id || '')
  const [projectKey, setProjectKey] = useState("")
  const [isJoining, setIsJoining] = useState(false)
  const [joinError, setJoinError] = useState("")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null)
  const [searchStatus, setSearchStatus] = useState<"idle" | "searching" | "found" | "not_found">("idle")
  const [foundProject, setFoundProject] = useState<any>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const handleDeleteProject = async (projectId: string) => {
    try {
      const { error } = await deleteProject(projectId)
      if (error) throw error;
      toast.success("Project deleted successfully")
    } catch (error: any) {
      console.error('Error deleting project:', error);
      toast.error(error.message || 'Failed to delete project. Please try again.')
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
        let joiningUserName = 'Someone';
        let joiningUserEmail = 'unknown';
        try {
          console.log('Fetching profile for user ID:', user?.id); // Log the ID being used
          const { data: userData, error: userError } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', user?.id)
            .single()

          if (userError) {
            // Log the detailed error if it exists
            console.error('Error getting user profile:', userError?.message || userError);
            toast.warning("Could not fetch your profile details, using default name in notification.");
          } else if (userData) {
            joiningUserName = userData.full_name || joiningUserName;
            joiningUserEmail = userData.email || joiningUserEmail;
            console.log('Successfully fetched joining user profile:', { joiningUserName, joiningUserEmail });
          } else {
             console.warn('No profile data found for user ID:', user?.id);
             toast.warning("No profile data found, using default name in notification.");
          }
        } catch (profileFetchError) {
            console.error('Exception during profile fetch:', profileFetchError);
            toast.warning("Error fetching profile, using default name in notification.");
        }
        
        // Create notification for project owner
        try {
          const { data: notificationData, error: notificationError } = await supabase
            .from('notifications')
            .insert([{
              user_id: matchedProject.owner_id,
              type: 'join_request',
              title: 'New Join Request',
              content: `${joiningUserName} has requested to join your project: ${matchedProject.name}`,
              metadata: JSON.stringify({
                project_id: matchedProject.id,
                project_name: matchedProject.name,
                user_id: user?.id,
                user_name: joiningUserName, // Use variable
                user_email: joiningUserEmail, // Use variable
                team_member_id: newMember?.[0]?.id
              }),
              read: false,
              created_at: new Date().toISOString()
            }])
            .select()
          
          if (notificationError) {
            console.error('Error creating notification:', notificationError);
            console.error('Notification details:', {
              user_id: matchedProject.owner_id,
              type: 'join_request',
              title: 'New Join Request',
              content: `${joiningUserName} has requested to join your project: ${matchedProject.name}`,
              metadata: {
                project_id: matchedProject.id,
                project_name: matchedProject.name,
                user_id: user?.id,
                user_name: joiningUserName,
                user_email: joiningUserEmail,
                team_member_id: newMember?.[0]?.id
              }
            });
          } else {
            console.log('Notification created successfully:', notificationData);
          }
        } catch (notifyError) {
          console.error('Exception during notification creation:', notifyError);
          // Don't fail the whole join process if notification fails
          toast.error('Note: Join request notification could not be sent to project owner, but you have been added to the pending members list.');
        }

        // Clear the input and close dialog
        setProjectKey("")
        const dialog = document.querySelector('[data-state="open"]')
        if (dialog) {
          const closeButton = dialog.querySelector('button[aria-label="Close"]') as HTMLButtonElement
          closeButton?.click()
        }

        // Show success message using toast
        toast.success('Successfully joined project! Redirecting...')
        
        // Redirect to the project page after a short delay
        setTimeout(() => {
          router.push(`/projects/${matchedProject.id}`)
        }, 1000)
        
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
        const closeButton = dialog.querySelector('button[aria-label="Close"]') as HTMLButtonElement
        closeButton?.click()
      }

      // Show success message using toast
      toast.success('Successfully joined project! Redirecting...')
      
      // Redirect to the project page after a short delay
      setTimeout(() => {
        router.push(`/projects/${projectData.id}`)
      }, 1000)
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

  const handleNewProjectClick = () => {
    if (user?.role === 'viewer') {
      setIsUpgradeDialogOpen(true)
    } else {
      router.push('/projects/new')
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
        <div className="flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-3 mb-6">
          {/* Search Bar - Moved here */}
          <div className="relative flex-1 w-full sm:max-w-xs order-1 sm:order-none">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-800/30 border-gray-700 w-full"
            />
          </div>
          <div className="flex gap-3 order-2 sm:order-none">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-gray-700 bg-gray-800/30 text-white hover:bg-purple-900/20 hover:text-purple-400">
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
              <Button
                onClick={handleNewProjectClick}
                className="gradient-button"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </Button>
            )}
          </div>
        </div>

        {/* Project Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-6 mb-8">
             <div className="leonardo-card p-3 sm:p-4 flex items-center cursor-pointer hover:border-blue-500/50 transition-colors" onClick={() => setStatusFilter(null)}>
              <div className="p-2 sm:p-3 rounded-full bg-blue-500/20 mr-2 sm:mr-4">
                <Briefcase className="w-4 h-4 sm:w-6 sm:h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-400">Total Projects</p>
                <h3 className="text-lg sm:text-2xl font-bold mt-0.5 sm:mt-1">{projects.length}</h3>
              </div>
            </div>

            <div className="leonardo-card p-3 sm:p-4 flex items-center cursor-pointer hover:border-green-500/50 transition-colors" onClick={() => setStatusFilter(statusFilter === "active" ? null : "active")}>
              <div className="p-2 sm:p-3 rounded-full bg-green-500/20 mr-2 sm:mr-4">
                <Clock className="w-4 h-4 sm:w-6 sm:h-6 text-green-400" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-400">Active Projects</p>
                <h3 className="text-lg sm:text-2xl font-bold mt-0.5 sm:mt-1">
                  {projects.filter((p) => p.status.toLowerCase() === "active").length}
                </h3>
              </div>
            </div>

            <div className="leonardo-card p-3 sm:p-4 flex items-center cursor-pointer hover:border-yellow-500/50 transition-colors" onClick={() => setStatusFilter(statusFilter === "pending" ? null : "pending")}>
              <div className="p-2 sm:p-3 rounded-full bg-yellow-500/20 mr-2 sm:mr-4">
                <AlertCircle className="w-4 h-4 sm:w-6 sm:h-6 text-yellow-400" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-400">Pending</p>
                <h3 className="text-lg sm:text-2xl font-bold mt-0.5 sm:mt-1">
                  {projects.filter((p) => p.status.toLowerCase() === "pending").length}
                </h3>
              </div>
            </div>

            <div className="leonardo-card p-3 sm:p-4 flex items-center cursor-pointer hover:border-red-500/50 transition-colors" onClick={() => setStatusFilter(statusFilter === "on hold" ? null : "on hold")}>
              <div className="p-2 sm:p-3 rounded-full bg-red-500/20 mr-2 sm:mr-4">
                <PauseCircle className="w-4 h-4 sm:w-6 sm:h-6 text-red-400" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-400">On Hold</p>
                <h3 className="text-lg sm:text-2xl font-bold mt-0.5 sm:mt-1">
                  {projects.filter((p) => p.status.toLowerCase() === "on hold").length}
                </h3>
              </div>
            </div>

            <div className="leonardo-card p-3 sm:p-4 flex items-center cursor-pointer hover:border-purple-500/50 transition-colors" onClick={() => setStatusFilter(statusFilter === "completed" ? null : "completed")}>
              <div className="p-2 sm:p-3 rounded-full bg-purple-500/20 mr-2 sm:mr-4">
                <CheckCircle className="w-4 h-4 sm:w-6 sm:h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-400">Completed</p>
                <h3 className="text-lg sm:text-2xl font-bold mt-0.5 sm:mt-1">
                  {projects.filter((p) => p.status.toLowerCase() === "completed").length}
                </h3>
              </div>
            </div>
        </div>

        {/* Projects List */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-white">
              {statusFilter ? `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Projects` : 'All Projects'}
            </h2>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                className="border-gray-700 bg-gray-800/30 text-white hover:bg-purple-900/20 hover:text-purple-400"
                onClick={() => setStatusFilter(null)}
              >
                {statusFilter ? 'Show All' : 'Filter'}
              </Button>
              <Button variant="outline" className="border-gray-700 bg-gray-800/30 text-white hover:bg-purple-900/20 hover:text-purple-400">
                Sort
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects
              .filter(project => {
                const matchesStatus = !statusFilter || project.status.toLowerCase() === statusFilter.toLowerCase();
                const matchesSearch = !searchQuery || 
                  project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()));
                return matchesStatus && matchesSearch;
              })
              .map((project) => (
              <Card 
                key={project.id} 
                className="leonardo-card border-gray-800 cursor-pointer hover:border-blue-500/50 transition-colors relative"
                onClick={() => router.push(`/projects/${project.id}`)}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-purple-900/20 hover:text-purple-400">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56 bg-gray-900 border-gray-700">
                        <DropdownMenuLabel>Project Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-gray-700" />
                        <DropdownMenuItem 
                          className="text-white hover:bg-purple-900/20 hover:text-purple-400 focus:bg-purple-900/20 focus:text-purple-400"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            router.push(`/publicprojects/${project.id}`);
                          }}
                        >
                          Public View
                        </DropdownMenuItem>
                        {user?.role !== 'viewer' && (
                          <>
                            <DropdownMenuItem 
                              className="text-white hover:bg-purple-900/20 hover:text-purple-400 focus:bg-purple-900/20 focus:text-purple-400"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                router.push(`/projects/${project.id}`);
                              }}
                            >
                              Edit Project
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-400 hover:bg-purple-900/20 hover:text-purple-400 cursor-pointer focus:bg-purple-900/20 focus:text-purple-400"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                handleDeleteProject(project.id);
                              }}
                            >
                              Delete Project
                            </DropdownMenuItem>
                          </>
                        )}
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

                    <div className="flex justify-between text-sm items-center">
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
                      <div className="flex gap-2">
                        {user?.id && project.owner_id === user.id && (
                          <Badge variant="outline" className="text-xs font-normal text-blue-400 border-blue-600 px-1.5 py-0.5">
                            Owner
                          </Badge>
                        )}
                        {user?.id && project.owner_id !== user.id && (
                          <Badge variant="outline" className="text-xs font-normal text-green-400 border-green-600 px-1.5 py-0.5">
                            Joined
                          </Badge>
                        )}
                      </div>
                      {project.team_members && project.team_members.length > 0 && (
                        <div className="ml-auto pl-2">
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

        {/* Create Project Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          {/* Existing create project dialog content ... */}
        </Dialog>

        {/* Upgrade Account Dialog */}
        <Dialog open={isUpgradeDialogOpen} onOpenChange={setIsUpgradeDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Upgrade Required</DialogTitle>
              <DialogDescription>
                You must upgrade your account to create and manage projects.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-4 mt-6">
              <Button
                variant="outline"
                className="border-gray-700 bg-gray-800/30 text-white hover:bg-purple-900/20 hover:text-purple-400"
                onClick={() => setIsUpgradeDialogOpen(false)}
              >
                Close
              </Button>
              <Button
                className="gradient-button hover:bg-purple-700"
                onClick={() => {
                  setIsUpgradeDialogOpen(false)
                  router.push('/account-types')
                }}
              >
                Upgrade Account
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}

