"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Handshake, ArrowLeft, Search, Briefcase, Lock } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase"
import { Badge } from "@/components/ui/badge"
import { useProjects } from "@/hooks/useProjects"
import { Project } from "@/types"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function MakeDealPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
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
    requirements: "",
    terms: "",
    budget: "",
    equity_share: "",
    roi_expectation: "",
    confidentiality_level: "private",
    project_id: searchParams.get('project') || ""
  })

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (!dealData.project_id) {
      toast({
        title: "Error",
        description: "Please select a project for the deal",
        variant: "destructive"
      })
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('deals')
        .insert([{
          ...dealData,
          requirements: dealData.requirements ? JSON.parse(dealData.requirements) : {},
          terms: dealData.terms ? JSON.parse(dealData.terms) : {},
          budget: parseFloat(dealData.budget) || null,
          equity_share: parseFloat(dealData.equity_share) || null,
          roi_expectation: parseFloat(dealData.roi_expectation) || null
        }])
        .select()
        .single()

      if (error) throw error

      toast({
        title: "Success",
        description: "Deal created successfully"
      })

      router.push(`/deals/${data.id}`)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
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
                <Label>Select Project</Label>
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
                  <Tabs defaultValue="public" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="public">Public Projects</TabsTrigger>
                      <TabsTrigger value="private">Private Project</TabsTrigger>
                    </TabsList>
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
                  <Textarea
                    placeholder="Describe the deal"
                    value={dealData.description}
                    onChange={(e) => setDealData({ ...dealData, description: e.target.value })}
                    required
                  />
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
                  <Label>Requirements (JSON format)</Label>
                  <Textarea
                    placeholder='{"requirement1": "value1", "requirement2": "value2"}'
                    value={dealData.requirements}
                    onChange={(e) => setDealData({ ...dealData, requirements: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Terms (JSON format)</Label>
                  <Textarea
                    placeholder='{"term1": "value1", "term2": "value2"}'
                    value={dealData.terms}
                    onChange={(e) => setDealData({ ...dealData, terms: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Budget ($)</Label>
                  <Input
                    type="number"
                    placeholder="Enter budget"
                    value={dealData.budget}
                    onChange={(e) => setDealData({ ...dealData, budget: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Equity Share (%)</Label>
                  <Input
                    type="number"
                    placeholder="Enter equity share percentage"
                    value={dealData.equity_share}
                    onChange={(e) => setDealData({ ...dealData, equity_share: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Expected ROI (%)</Label>
                  <Input
                    type="number"
                    placeholder="Enter expected ROI percentage"
                    value={dealData.roi_expectation}
                    onChange={(e) => setDealData({ ...dealData, roi_expectation: e.target.value })}
                  />
                </div>

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

              <Button type="submit" className="w-full gradient-button" disabled={loading || !selectedProject}>
                {loading ? "Creating Deal..." : "Create Deal"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 