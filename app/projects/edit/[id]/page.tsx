"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Home, ArrowLeft, Save, Calendar, Users, DollarSign, AlertCircle } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabase"

export default function EditProjectPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string
  const { user, loading: authLoading } = useAuth()

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [projectData, setProjectData] = useState({
    name: "",
    description: "",
    type: "",
    status: "",
    progress: 0,
    deadline: "",
    budget: "",
    invested: 0,
    roi: 0
  })

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }
  }, [user, authLoading, router])

  useEffect(() => {
    const fetchProject = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const { data: project, error } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .single()

        if (error) throw error

        if (project) {
          // Format the date to YYYY-MM-DD for the input field
          const formattedDate = new Date(project.deadline).toISOString().split("T")[0]

          setProjectData({
            name: project.name,
            description: project.description || "",
            type: project.type,
            status: project.status,
            progress: project.progress || 0,
            deadline: formattedDate,
            budget: project.budget?.toString() || "",
            invested: project.invested || 0,
            roi: project.roi || 0
          })
        } else {
          setError("Project not found")
        }
      } catch (err: any) {
        setError(err.message || "Failed to load project data")
        console.error("Error fetching project:", err)
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      fetchProject()
    }
  }, [projectId, user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setProjectData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setProjectData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // Convert deadline to timestamptz
      const deadlineDate = new Date(projectData.deadline)
      deadlineDate.setHours(23, 59, 59, 999)

      const { error } = await supabase
        .from('projects')
        .update({
          name: projectData.name,
          description: projectData.description,
          type: projectData.type.toLowerCase(),
          status: projectData.status,
          progress: projectData.progress,
          deadline: deadlineDate.toISOString(),
          budget: projectData.budget ? parseFloat(projectData.budget) : null,
          invested: projectData.invested,
          roi: projectData.roi
        })
        .eq('id', projectId)

      if (error) throw error

      // Redirect to project details page after successful update
      router.push(`/projects/${projectId}`)
    } catch (error: any) {
      console.error("Error updating project:", error)
      setError(error.message || "Failed to update project. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    )
  }

  // Don't render if not authenticated
  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen">
      <header className="leonardo-header">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center">
            <Link
              href={`/projects/${projectId}`}
              className="inline-flex items-center text-white hover:text-blue-300 transition-colors mr-4"
            >
              <ArrowLeft className="w-6 h-6 mr-2" />
              Back to Project
            </Link>
            <h1 className="text-3xl font-bold">Edit Project</h1>
          </div>
          <Link href="/dashboard" className="inline-flex items-center text-white hover:text-blue-300 transition-colors">
            <Home className="w-6 h-6 mr-2" />
            Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-12 h-12 border-4 border-t-blue-500 border-b-blue-500 border-l-transparent border-r-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <Card className="leonardo-card border-gray-800">
            <CardHeader>
              <CardTitle className="text-red-400 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                Error
              </CardTitle>
              <CardDescription className="text-gray-400">{error}</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button className="gradient-button" onClick={() => router.push("/projects")}>
                Return to Projects
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <Card className="leonardo-card border-gray-800">
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
              <CardDescription className="text-gray-400">
                Update the information below to edit this project.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Enter project name"
                    className="leonardo-input"
                    value={projectData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Describe the project goals and scope"
                    className="leonardo-input min-h-[120px]"
                    value={projectData.description}
                    onChange={handleChange}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Project Type</Label>
                    <Select
                      value={projectData.type}
                      onValueChange={(value) => handleSelectChange("type", value)}
                    >
                      <SelectTrigger id="type" className="leonardo-input">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="investment">Investment</SelectItem>
                        <SelectItem value="development">Development</SelectItem>
                        <SelectItem value="research">Research</SelectItem>
                        <SelectItem value="consulting">Consulting</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={projectData.status}
                      onValueChange={(value) => handleSelectChange("status", value)}
                    >
                      <SelectTrigger id="status" className="leonardo-input">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="on hold">On Hold</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="deadline">Deadline</Label>
                    <Input
                      id="deadline"
                      name="deadline"
                      type="date"
                      className="leonardo-input"
                      value={projectData.deadline}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="progress">Progress (%)</Label>
                    <Input
                      id="progress"
                      name="progress"
                      type="number"
                      min="0"
                      max="100"
                      className="leonardo-input"
                      value={projectData.progress}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="budget">Budget ($)</Label>
                    <Input
                      id="budget"
                      name="budget"
                      type="number"
                      min="0"
                      step="0.01"
                      className="leonardo-input"
                      value={projectData.budget}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="invested">Invested ($)</Label>
                    <Input
                      id="invested"
                      name="invested"
                      type="number"
                      min="0"
                      step="0.01"
                      className="leonardo-input"
                      value={projectData.invested}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="roi">ROI (%)</Label>
                    <Input
                      id="roi"
                      name="roi"
                      type="number"
                      min="0"
                      step="0.01"
                      className="leonardo-input"
                      value={projectData.roi}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </CardContent>

              <CardFooter className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  className="border-gray-700 bg-gray-800/30 text-white hover:bg-gray-800"
                  onClick={() => router.push(`/projects/${projectId}`)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="gradient-button"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        )}
      </main>
    </div>
  )
}

