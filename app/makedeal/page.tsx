"use client"

import { Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Handshake, ArrowLeft, Search, Briefcase, Lock, Sparkles, Loader2 } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import { Badge } from "@/components/ui/badge"
import { useProjects } from "@/hooks/useProjects"
import { Project } from "@/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/hooks/useAuth"

function MakeDealPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [projectKey, setProjectKey] = useState("")
  const [searchingPrivate, setSearchingPrivate] = useState(false)
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const { projects, loading: projectsLoading, error: projectsError } = useProjects()
  const [dealData, setDealData] = useState({
    title: "",
    description: "",
    deal_type: "",
    custom_type: "",
    confidentiality_level: "private",
    project_id: searchParams.get('project') || ""
  })
  const [userSearchQuery, setUserSearchQuery] = useState("")
  const [searchingUser, setSearchingUser] = useState(false)
  const [foundUser, setFoundUser] = useState<any>(null)
  const [selectedUsers, setSelectedUsers] = useState<any[]>([])
  const [enhancingDescription, setEnhancingDescription] = useState(false)

  // Fetch project if ID is provided in URL
  useEffect(() => {
    const projectId = searchParams.get('project')
    if (projectId && projects) {
      const project = projects.find(p => p.id === projectId)
      if (project) {
        setSelectedProject(project)
        setDealData(prev => ({ ...prev, project_id: project.id }))
      }
    }
  }, [searchParams, projects])

  // Filter projects based on search query
  useEffect(() => {
    if (!projects) return

    if (!searchQuery.trim()) {
      setFilteredProjects(projects)
      return
    }

    const filtered = projects.filter(project =>
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setFilteredProjects(filtered)
  }, [searchQuery, projects])

  const handleProjectSelect = (project: Project) => {
    setSelectedProject(project)
    setDealData(prev => ({ ...prev, project_id: project.id }))
    setSearchQuery("") // Clear search query
    setProjectKey("") // Clear project key
  }

  const handleEnhanceDescription = async () => {
    const currentDescription = dealData.description.trim()
    if (!currentDescription) {
      toast({
        title: "Error",
        description: "Please enter a description to enhance",
        variant: "destructive"
      })
      return
    }

    setEnhancingDescription(true)
    try {
      const response = await fetch('/api/enhance-comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: currentDescription })
      })

      if (!response.ok) {
        const { error } = await response.json()
        throw new Error(error || 'Enhancement failed')
      }

      const data = await response.json()
      setDealData(prev => ({ ...prev, description: data.message }))
      toast({
        title: "Success",
        description: "Description enhanced with AI"
      })
    } catch (error: any) {
      console.error('Description enhancement error:', error)
      toast({
        title: "Error",
        description: error?.message || 'Failed to enhance description',
        variant: "destructive"
      })
    } finally {
      setEnhancingDescription(false)
    }
  }

  const handlePrivateProjectSearch = async () => {
    if (!projectKey.trim()) {
      toast({
        title: "Error",
        description: "Please enter a project key",
        variant: "destructive"
      })
      return
    }

    setSearchingPrivate(true)
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          owner:owner_id (
            id,
            name,
            email
          )
        `)
        .eq('project_key', projectKey.trim())
        .eq('visibility', 'private')
        .single()

      if (error) throw error

      if (data) {
        setSelectedProject(data)
        setDealData(prev => ({ ...prev, project_id: data.id }))
        toast({
          title: "Success",
          description: "Private project found",
        })
      }
    } catch (error: any) {
      console.error('Error searching private project:', error)
      toast({
        title: "Error",
        description: "Invalid project key or project not found",
        variant: "destructive"
      })
    } finally {
      setSearchingPrivate(false)
    }
  }

  const handleUserSearch = async () => {
    if (!userSearchQuery.trim()) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive"
      })
      return
    }

    setSearchingUser(true)
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, avatar_url')
        .eq('email', userSearchQuery.trim())
        .single()

      if (error) throw error

      if (data) {
        setFoundUser(data)
        toast({
          title: "Success",
          description: `Found user: ${data.name}`,
        })
      }
    } catch (error: any) {
      console.error('Error searching user:', error)
      setFoundUser(null)
      toast({
        title: "Error",
        description: "User not found with this email address",
        variant: "destructive"
      })
    } finally {
      setSearchingUser(false)
    }
  }

  const handleAddUser = () => {
    if (!foundUser) {
      toast({
        title: "Error",
        description: "Please search for a user first",
        variant: "destructive"
      })
      return
    }

    // Check if user is already selected
    if (selectedUsers.some(user => user.id === foundUser.id)) {
      toast({
        title: "Error",
        description: "User is already added",
        variant: "destructive"
      })
      return
    }

    setSelectedUsers(prev => [...prev, foundUser])
    setFoundUser(null)
    setUserSearchQuery("")
    toast({
      title: "Success",
      description: `Added ${foundUser.name} to the deal`,
    })
  }

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers(prev => prev.filter(user => user.id !== userId))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Validate required fields
    if (!dealData.title || !dealData.deal_type) {
      toast({
        title: "Error",
        description: "Please fill in all required fields (title, deal type).",
        variant: "destructive"
      })
      setLoading(false)
      return
    }
    if (!user || !user.id) {
      toast({
        title: "Error",
        description: "You must be signed in to create a deal.",
        variant: "destructive"
      })
      setLoading(false)
      return
    }
    // Validate deal_type
    const validDealTypes = ["investment", "partnership", "collaboration", "acquisition", "custom"]
    if (!validDealTypes.includes(dealData.deal_type)) {
      toast({
        title: "Error",
        description: "Deal type is invalid.",
        variant: "destructive"
      })
      setLoading(false)
      return
    }
    
    // If custom, require custom_type
    if (dealData.deal_type === "custom" && !dealData.custom_type) {
      toast({
        title: "Error",
        description: "Please specify a custom deal type.",
        variant: "destructive"
      })
      setLoading(false)
      return
    }

    // Validate project_id as UUID if provided
    const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/
    if (dealData.project_id && !uuidRegex.test(dealData.project_id)) {
      toast({
        title: "Error",
        description: "Project ID is not a valid UUID.",
        variant: "destructive"
      })
      setLoading(false)
      return
    }
    // Build payload with all fields
    const payload: any = {
      title: dealData.title,
      description: dealData.description,
      deal_type: dealData.deal_type,
      confidentiality_level: dealData.confidentiality_level,
      requirements: {},
      initiator_id: user.id
    }
    
    // Add custom_type if deal type is custom
    if (dealData.deal_type === "custom" && dealData.custom_type) {
      payload.custom_type = dealData.custom_type;
    }
    
    // Only add project_id if it's provided
    if (dealData.project_id) {
      payload.project_id = dealData.project_id;
    }
    const logObject = Object.fromEntries(
      Object.entries(payload).map(([k, v]) => [k, { value: v, type: typeof v }])
    )
    console.log("Deal insert payload (values and types):", logObject)

    try {
      const { data: dealData, error: dealError } = await supabase
        .from('deals')
        .insert([payload])
        .select()
        .single()

      if (dealError) throw dealError

      // Add all selected users as participants
      if (selectedUsers.length > 0 && dealData) {
        const participants = selectedUsers.map(user => ({
          deal_id: dealData.id,
          user_id: user.id,
          status: 'pending',
          role: 'participant'
        }))

        const { error: participantError } = await supabase
          .from('deal_participants')
          .insert(participants)

        if (participantError) {
          console.error('Error adding participants:', participantError)
          // Don't fail the whole operation, just log the error
        }
      }

      toast({
        title: "Success",
        description: "Deal created successfully"
      })

      router.push(`/deals`)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || JSON.stringify(error),
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="min-h-screen bg-gray-950 text-white p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>

          <Card className="leonardo-card border-gray-800">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center">
                <Handshake className="w-6 h-6 mr-2" />
                Make a Deal
              </CardTitle>
              <CardDescription>Create a new business deal or partnership</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Project Selection Section */}
                <div className="space-y-4 mb-8">
                  <div>
                    <Label>Select Project (Optional)</Label>
                    <p className="text-sm text-gray-400 mt-1">Choose a project to associate with this deal, or leave blank for a standalone deal</p>
                  </div>
                  {selectedProject ? (
                    <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-medium">{selectedProject.name}</h3>
                          <p className="text-sm text-gray-400">{selectedProject.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {selectedProject.status}
                            </Badge>
                            <Badge variant={selectedProject.visibility === 'public' ? 'outline' : 'secondary'} className="text-xs">
                              {selectedProject.visibility === 'public' ? 'Public' : 'Private'}
                            </Badge>
                            {selectedProject.owner?.name && (
                              <span className="text-xs text-gray-400">
                                Owner: {selectedProject.owner.name}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          className="border-gray-700"
                          onClick={() => {
                            setSelectedProject(null)
                            setDealData(prev => ({ ...prev, project_id: "" }))
                          }}
                        >
                          Change Project
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Tabs defaultValue="custom" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="custom">Custom</TabsTrigger>
                        <TabsTrigger value="public">Public Projects</TabsTrigger>
                        <TabsTrigger value="private">Private Project</TabsTrigger>
                      </TabsList>
                      <TabsContent value="custom" className="space-y-4">
                        <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700">
                          <div className="text-center">
                            <Handshake className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                            <h3 className="text-lg font-medium mb-2">Custom Deal</h3>
                            <p className="text-sm text-gray-400">
                              Make a custom deal.
                            </p>
                          </div>
                        </div>
                      </TabsContent>
                      <TabsContent value="public" className="space-y-4">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Search for a project..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="flex-1"
                          />
                        </div>
                        
                        {projectsLoading ? (
                          <div className="text-center py-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                          </div>
                        ) : projectsError ? (
                          <div className="text-center text-red-400 py-4">
                            Error loading projects: {projectsError}
                          </div>
                        ) : filteredProjects.length > 0 ? (
                          <div className="space-y-2 max-h-[300px] overflow-y-auto">
                            {filteredProjects.map((project) => (
                              <div
                                key={project.id}
                                className="p-3 bg-gray-800/30 rounded-lg border border-gray-700 cursor-pointer hover:bg-gray-800/50"
                                onClick={() => handleProjectSelect(project)}
                              >
                                <div className="flex items-center gap-3">
                                  <Briefcase className="w-5 h-5 text-gray-400" />
                                  <div>
                                    <h3 className="font-medium">{project.name}</h3>
                                    <p className="text-sm text-gray-400 line-clamp-1">
                                      {project.description}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge variant="outline" className="text-xs">
                                        {project.status}
                                      </Badge>
                                      {project.owner?.name && (
                                        <span className="text-xs text-gray-400">
                                          Owner: {project.owner.name}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-center text-gray-400">No projects found</p>
                        )}
                      </TabsContent>
                      <TabsContent value="private" className="space-y-4">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Enter project key (e.g., COV-ABC12)"
                            value={projectKey}
                            onChange={(e) => setProjectKey(e.target.value)}
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            onClick={handlePrivateProjectSearch}
                            disabled={searchingPrivate || !projectKey.trim()}
                          >
                            {searchingPrivate ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            ) : (
                              <Lock className="w-4 h-4 mr-2" />
                            )}
                            {searchingPrivate ? 'Searching...' : 'Find Project'}
                          </Button>
                        </div>
                        <p className="text-sm text-gray-400">
                          Enter the project key to find and select a private project. You can get this key from the project owner.
                        </p>
                      </TabsContent>
                    </Tabs>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Deal Title</Label>
                    <Input
                      placeholder="Enter deal title"
                      value={dealData.title}
                      onChange={(e) => setDealData({ ...dealData, title: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label>Description</Label>
                    <div className="relative">
                      <Textarea
                        placeholder="Describe the deal"
                        value={dealData.description}
                        onChange={(e) => setDealData({ ...dealData, description: e.target.value })}
                        className="pr-10"
                        required
                      />
                      {dealData.description.trim() && (
                        <button
                          type="button"
                          onClick={handleEnhanceDescription}
                          disabled={enhancingDescription}
                          className="absolute bottom-3 right-3 p-2 hover:bg-purple-500/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Enhance with AI"
                        >
                          {enhancingDescription ? (
                            <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                          ) : (
                            <Sparkles className="w-4 h-4 text-purple-400" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label>Add Users (Optional)</Label>
                    <div className="flex gap-2">
                      <Input
                        type="email"
                        placeholder="Enter user email to search"
                        value={userSearchQuery}
                        onChange={(e) => setUserSearchQuery(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        onClick={handleUserSearch}
                        disabled={searchingUser || !userSearchQuery.trim()}
                      >
                        {searchingUser ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <Search className="w-4 h-4 mr-2" />
                        )}
                        {searchingUser ? 'Searching...' : 'Find User'}
                      </Button>
                    </div>
                    
                    {foundUser && (
                      <div className="mt-3 p-3 bg-gray-800/30 rounded-lg border border-gray-700">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                            {foundUser.avatar_url ? (
                              <img src={foundUser.avatar_url} alt={foundUser.name} className="w-10 h-10 rounded-full" />
                            ) : (
                              <span className="text-sm font-medium">{foundUser.name?.charAt(0)?.toUpperCase()}</span>
                            )}
                          </div>
                          <div>
                            <h3 className="font-medium">{foundUser.name}</h3>
                            <p className="text-sm text-gray-400">{foundUser.email}</p>
                          </div>
                          <div className="flex gap-2 ml-auto">
                            <Button
                              type="button"
                              size="sm"
                              onClick={handleAddUser}
                            >
                              Add User
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setFoundUser(null)
                                setUserSearchQuery("")
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedUsers.length > 0 && (
                      <div className="mt-4">
                        <Label className="text-sm text-gray-400 mb-2">Selected Users ({selectedUsers.length})</Label>
                        <div className="space-y-2">
                          {selectedUsers.map((user) => (
                            <div key={user.id} className="p-3 bg-gray-800/30 rounded-lg border border-gray-700">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                                  {user.avatar_url ? (
                                    <img src={user.avatar_url} alt={user.name} className="w-8 h-8 rounded-full" />
                                  ) : (
                                    <span className="text-xs font-medium">{user.name?.charAt(0)?.toUpperCase()}</span>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <h3 className="font-medium text-sm">{user.name}</h3>
                                  <p className="text-xs text-gray-400">{user.email}</p>
                                </div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRemoveUser(user.id)}
                                  className="text-red-400 hover:text-red-300"
                                >
                                  Remove
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label>Deal Type</Label>
                    <Select
                      value={dealData.deal_type}
                      onValueChange={(value) => setDealData({ ...dealData, deal_type: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select deal type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="investment">Investment</SelectItem>
                        <SelectItem value="partnership">Partnership</SelectItem>
                        <SelectItem value="collaboration">Collaboration</SelectItem>
                        <SelectItem value="acquisition">Acquisition</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {dealData.deal_type === "custom" && (
                    <div>
                      <Label>Custom Deal Type</Label>
                      <Input
                        placeholder="Enter custom deal type"
                        value={dealData.custom_type}
                        onChange={(e) => setDealData({ ...dealData, custom_type: e.target.value })}
                        required
                      />
                    </div>
                  )}

                  <div>
                    <Label>Confidentiality Level</Label>
                    <Select
                      value={dealData.confidentiality_level}
                      onValueChange={(value) => setDealData({ ...dealData, confidentiality_level: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select confidentiality level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                        <SelectItem value="confidential">Confidential</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button type="submit" className="w-full gradient-button" disabled={loading || enhancingDescription}>
                  {loading ? "Creating Deal..." : "Create Deal"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}

export default function MakeDealPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-950 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <Card className="leonardo-card border-gray-800">
            <CardContent className="py-8">
              <div className="flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="ml-3 text-lg text-gray-400">Loading...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    }>
      <MakeDealPageContent />
    </Suspense>
  )
} 