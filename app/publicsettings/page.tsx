"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useAuth } from "@/hooks/useAuth"
import { useProjects } from "@/hooks/useProjects"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { ArrowLeft, DollarSign, Target, Eye, Briefcase, Users } from "lucide-react"
import { toast } from "sonner"

function PublicSettingsPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { projects, loading: projectsLoading, updateProject } = useProjects(user?.id || '')
  const [selectedProject, setSelectedProject] = useState(searchParams.get("project") || "")
  const [loading, setLoading] = useState(false)

  const handleTogglePublicFunding = async () => {
    if (!selectedProject) return
    setLoading(true)
    try {
      const project = projects?.find(p => p.id === selectedProject)
      if (!project) throw new Error("Project not found")

      const { data, error } = await updateProject(project.id, {
        accepts_donations: !project.accepts_donations
      })

      if (error) throw error

      toast.success(data.accepts_donations 
        ? "Public funding enabled"
        : "Public funding disabled"
      )
    } catch (error) {
      console.error('Error toggling public funding:', error)
      toast.error("Failed to toggle public funding status")
    } finally {
      setLoading(false)
    }
  }

  const handleToggleVisibility = async () => {
    if (!selectedProject) return
    setLoading(true)
    try {
      const project = projects?.find(p => p.id === selectedProject)
      if (!project) throw new Error("Project not found")

      const { data, error } = await updateProject(project.id, {
        visibility: project.visibility === 'public' ? 'private' : 'public'
      })

      if (error) throw error

      toast.success(data.visibility === 'public'
        ? "Project is now public"
        : "Project is now private"
      )
    } catch (error) {
      console.error('Error toggling project visibility:', error)
      toast.error("Failed to toggle project visibility")
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>Please log in to access public settings.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/login")}>Login</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              className="text-gray-400 hover:text-purple-400"
              onClick={() => router.back()}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white">Public Settings</h1>
              <p className="text-gray-400">Manage public visibility and funding settings</p>
            </div>
          </div>
        </div>

        {/* Project Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Select Project</CardTitle>
            <CardDescription className="text-gray-400">
              Choose a project to manage its public settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full rounded-md border border-gray-700 bg-gray-800/30 px-3 py-2 text-white"
                disabled={projectsLoading}
              >
                <option value="">Select a project</option>
                {projects?.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              {projectsLoading && (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <LoadingSpinner className="w-4 h-4" />
                  Loading projects...
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {selectedProject && (
          <div className="space-y-6">
            {/* Project Visibility Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Project Visibility</CardTitle>
                    <CardDescription className="text-gray-400">
                      Control whether your project appears on the public projects page
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    className={`w-full md:w-auto justify-center items-center gap-2 ${
                      projects?.find(p => p.id === selectedProject)?.visibility === 'public'
                        ? 'bg-green-500/20 text-green-400 border-green-500/50 hover:bg-green-500/30'
                        : 'bg-purple-500/20 text-purple-400 border-purple-500/50 hover:bg-purple-500/30'
                    }`}
                    onClick={handleToggleVisibility}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <LoadingSpinner className="w-4 h-4" />
                        Updating...
                      </>
                    ) : projects?.find(p => p.id === selectedProject)?.visibility === 'public' ? (
                      <>
                        <Eye className="w-4 h-4" /> Make Private
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4" /> Make Public
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-gray-800/30 rounded-lg">
                    <div className="flex items-center text-gray-400 mb-2">
                      <Eye className="w-4 h-4 mr-2" />
                      <span>Current Status</span>
                    </div>
                    <div className="text-white font-medium">
                      {projects?.find(p => p.id === selectedProject)?.visibility === 'public'
                        ? "Project is public" 
                        : "Project is private"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Public Funding Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Public Funding</CardTitle>
                    <CardDescription className="text-gray-400">
                      Enable or disable public funding for this project
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    className={`w-full md:w-auto justify-center items-center gap-2 ${
                      projects?.find(p => p.id === selectedProject)?.accepts_donations
                        ? 'bg-green-500/20 text-green-400 border-green-500/50 hover:bg-green-500/30'
                        : 'bg-purple-500/20 text-purple-400 border-purple-500/50 hover:bg-purple-500/30'
                    }`}
                    onClick={handleTogglePublicFunding}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <LoadingSpinner className="w-4 h-4" />
                        Updating...
                      </>
                    ) : projects?.find(p => p.id === selectedProject)?.accepts_donations ? (
                      <>
                        <DollarSign className="w-4 h-4" /> Disable Public Funding
                      </>
                    ) : (
                      <>
                        <DollarSign className="w-4 h-4" /> Enable Public Funding
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-gray-800/30 rounded-lg">
                    <div className="flex items-center text-gray-400 mb-2">
                      <DollarSign className="w-4 h-4 mr-2" />
                      <span>Current Status</span>
                    </div>
                    <div className="text-white font-medium">
                      {projects?.find(p => p.id === selectedProject)?.accepts_donations 
                        ? "Public funding is enabled" 
                        : "Public funding is disabled"}
                    </div>
                  </div>
                  {projects?.find(p => p.id === selectedProject)?.accepts_donations && (
                    <div className="p-4 bg-gray-800/30 rounded-lg">
                      <div className="flex items-center text-gray-400 mb-2">
                        <Target className="w-4 h-4 mr-2" />
                        <span>Funding Progress</span>
                      </div>
                      <div className="text-white font-medium">
                        ${projects?.find(p => p.id === selectedProject)?.current_funding?.toLocaleString() || '0'} / 
                        ${projects?.find(p => p.id === selectedProject)?.funding_goal?.toLocaleString() || '0'}
                      </div>
                      <div className="mt-2">
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-purple-500 h-2 rounded-full"
                            style={{ 
                              width: `${(() => {
                                const project = projects?.find(p => p.id === selectedProject)
                                return project?.funding_goal && project?.current_funding 
                                  ? (project.current_funding / project.funding_goal * 100).toFixed(0) 
                                  : 0
                              })()}%` 
                            }}
                          ></div>
                        </div>
                        <div className="text-right text-sm text-purple-400 mt-1">
                          {(() => {
                            const project = projects?.find(p => p.id === selectedProject)
                            return project?.funding_goal && project?.current_funding 
                              ? (project.current_funding / project.funding_goal * 100).toFixed(0) 
                              : 0
                          })()}% funded
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Make Deal Button Visibility Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Show Make Deal Button</CardTitle>
                    <CardDescription className="text-gray-400">
                      Control whether the Make Deal button appears on the public project card
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    className={`w-full md:w-auto justify-center items-center gap-2 ${
                      projects?.find(p => p.id === selectedProject)?.show_make_deal
                        ? 'bg-green-500/20 text-green-400 border-green-500/50 hover:bg-green-500/30'
                        : 'bg-purple-500/20 text-purple-400 border-purple-500/50 hover:bg-purple-500/30'
                    }`}
                    onClick={async () => {
                      setLoading(true)
                      try {
                        const project = projects?.find(p => p.id === selectedProject)
                        if (!project) throw new Error("Project not found")
                        const { data, error } = await updateProject(project.id, {
                          show_make_deal: !project.show_make_deal
                        })
                        if (error) throw error
                        toast.success(data.show_make_deal
                          ? "Make Deal button enabled"
                          : "Make Deal button hidden"
                        )
                      } catch (error) {
                        console.error('Error toggling Make Deal button:', error)
                        toast.error("Failed to toggle Make Deal button")
                      } finally {
                        setLoading(false)
                      }
                    }}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <LoadingSpinner className="w-4 h-4" />
                        Updating...
                      </>
                    ) : projects?.find(p => p.id === selectedProject)?.show_make_deal ? (
                      <>
                        <Briefcase className="w-4 h-4" /> Hide Make Deal
                      </>
                    ) : (
                      <>
                        <Briefcase className="w-4 h-4" /> Show Make Deal
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-gray-800/30 rounded-lg">
                    <div className="flex items-center text-gray-400 mb-2">
                      <Briefcase className="w-4 h-4 mr-2" />
                      <span>Current Status</span>
                    </div>
                    <div className="text-white font-medium">
                      {projects?.find(p => p.id === selectedProject)?.show_make_deal
                        ? "Make Deal button is visible"
                        : "Make Deal button is hidden"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Show Invest Button Visibility Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Show Invest Button</CardTitle>
                    <CardDescription className="text-gray-400">
                      Control whether the Invest button appears on the public project card
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    className={`w-full md:w-auto justify-center items-center gap-2 ${
                      projects?.find(p => p.id === selectedProject)?.show_invest
                        ? 'bg-green-500/20 text-green-400 border-green-500/50 hover:bg-green-500/30'
                        : 'bg-purple-500/20 text-purple-400 border-purple-500/50 hover:bg-purple-500/30'
                    }`}
                    onClick={async () => {
                      setLoading(true)
                      try {
                        const project = projects?.find(p => p.id === selectedProject)
                        if (!project) throw new Error("Project not found")
                        const { data, error } = await updateProject(project.id, {
                          show_invest: !project.show_invest
                        })
                        if (error) throw error
                        toast.success(data.show_invest
                          ? "Invest button enabled"
                          : "Invest button hidden"
                        )
                      } catch (error) {
                        console.error('Error toggling Invest button:', error)
                        toast.error("Failed to toggle Invest button")
                      } finally {
                        setLoading(false)
                      }
                    }}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <LoadingSpinner className="w-4 h-4" />
                        Updating...
                      </>
                    ) : projects?.find(p => p.id === selectedProject)?.show_invest ? (
                      <>
                        <DollarSign className="w-4 h-4" /> Hide Invest
                      </>
                    ) : (
                      <>
                        <DollarSign className="w-4 h-4" /> Show Invest
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-gray-800/30 rounded-lg">
                    <div className="flex items-center text-gray-400 mb-2">
                      <DollarSign className="w-4 h-4 mr-2" />
                      <span>Current Status</span>
                    </div>
                    <div className="text-white font-medium">
                      {projects?.find(p => p.id === selectedProject)?.show_invest
                        ? "Invest button is visible"
                        : "Invest button is hidden"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Show Collaborate Button Visibility Settings */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Show Collaborate Button</CardTitle>
                    <CardDescription className="text-gray-400">
                      Control whether the Collaborate button appears on the public project card
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    className={`w-full md:w-auto justify-center items-center gap-2 ${
                      projects?.find(p => p.id === selectedProject)?.show_collaborate
                        ? 'bg-green-500/20 text-green-400 border-green-500/50 hover:bg-green-500/30'
                        : 'bg-purple-500/20 text-purple-400 border-purple-500/50 hover:bg-purple-500/30'
                    }`}
                    onClick={async () => {
                      setLoading(true)
                      try {
                        const project = projects?.find(p => p.id === selectedProject)
                        if (!project) throw new Error("Project not found")
                        const { data, error } = await updateProject(project.id, {
                          show_collaborate: !project.show_collaborate
                        })
                        if (error) throw error
                        toast.success(data.show_collaborate
                          ? "Collaborate button enabled"
                          : "Collaborate button hidden"
                        )
                      } catch (error) {
                        console.error('Error toggling Collaborate button:', error)
                        toast.error("Failed to toggle Collaborate button")
                      } finally {
                        setLoading(false)
                      }
                    }}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <LoadingSpinner className="w-4 h-4" />
                        Updating...
                      </>
                    ) : projects?.find(p => p.id === selectedProject)?.show_collaborate ? (
                      <>
                        <Users className="w-4 h-4" /> Hide Collaborate
                      </>
                    ) : (
                      <>
                        <Users className="w-4 h-4" /> Show Collaborate
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-gray-800/30 rounded-lg">
                    <div className="flex items-center text-gray-400 mb-2">
                      <Users className="w-4 h-4 mr-2" />
                      <span>Current Status</span>
                    </div>
                    <div className="text-white font-medium">
                      {projects?.find(p => p.id === selectedProject)?.show_collaborate
                        ? "Collaborate button is visible"
                        : "Collaborate button is hidden"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}

export default function PublicSettingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    }>
      <PublicSettingsPageContent />
    </Suspense>
  )
} 