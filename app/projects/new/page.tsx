"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Home, ArrowLeft, Save, Calendar, Users, DollarSign } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useUser } from "@/hooks/useUser"

export default function NewProjectPage() {
  const router = useRouter()
  const { user, loading } = useUser()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [projectData, setProjectData] = useState({
    name: "",
    description: "",
    type: "Investment" as const,
    status: "pending" as const,
    progress: 0,
    deadline: "",
    budget: "",
    invested: 0,
    roi: 0,
    visibility: "private" as const
  })

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [loading, user, router])

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

    try {
      if (!user?.id) {
        throw new Error("Please sign in to create a project")
      }

      // Convert deadline to timestamptz
      const deadlineDate = new Date(projectData.deadline)
      deadlineDate.setHours(23, 59, 59, 999)

      const { data, error } = await supabase
        .from('projects')
        .insert([{
          name: projectData.name,
          description: projectData.description,
          type: projectData.type.toLowerCase(),
          status: projectData.status,
          progress: projectData.progress,
          deadline: deadlineDate.toISOString(),
          budget: projectData.budget ? parseFloat(projectData.budget) : null,
          invested: projectData.invested,
          roi: projectData.roi,
          owner_id: user.id
        }])
        .select()
        .single()

      if (error) {
        console.error('Detailed error:', error)
        throw error
      }

      router.push("/projects")
    } catch (error: any) {
      console.error("Error creating project:", error)
      alert(error.message || "Failed to create project. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
          <p className="mt-4">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render the form if not authenticated
  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen">
      <header className="leonardo-header">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center">
            <Link
              href="/projects"
              className="inline-flex items-center text-white hover:text-blue-300 transition-colors mr-4"
            >
              <ArrowLeft className="w-6 h-6 mr-2" />
              Back to Projects
            </Link>
            <h1 className="text-3xl font-bold">Create New Project</h1>
          </div>
          <Link href="/dashboard" className="inline-flex items-center text-white hover:text-blue-300 transition-colors">
            <Home className="w-6 h-6 mr-2" />
            Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Card className="leonardo-card border-gray-800">
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
              <CardDescription className="text-gray-400">
                Fill in the information below to create a new project.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={projectData.name}
                  onChange={handleChange}
                  required
                  className="leonardo-input"
                  placeholder="Enter project name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={projectData.description}
                  onChange={handleChange}
                  className="leonardo-input min-h-[120px]"
                  placeholder="Describe the project goals and scope"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="type">Project Type</Label>
                  <Select
                    name="type"
                    value={projectData.type}
                    onValueChange={(value) => handleSelectChange("type", value)}
                  >
                    <SelectTrigger className="leonardo-input">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="investment">Investment</SelectItem>
                      <SelectItem value="collaboration">Collaboration</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deadline">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                      Deadline
                    </div>
                  </Label>
                  <Input
                    id="deadline"
                    name="deadline"
                    type="date"
                    value={projectData.deadline}
                    onChange={handleChange}
                    required
                    className="leonardo-input"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="budget">
                    <div className="flex items-center">
                      <DollarSign className="w-4 h-4 mr-2 text-gray-400" />
                      Budget
                    </div>
                  </Label>
                  <Input
                    id="budget"
                    name="budget"
                    type="number"
                    value={projectData.budget}
                    onChange={handleChange}
                    className="leonardo-input"
                    placeholder="Optional"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="visibility">Visibility</Label>
                  <Select
                    name="visibility"
                    value={projectData.visibility}
                    onValueChange={(value) => handleSelectChange("visibility", value)}
                  >
                    <SelectTrigger className="leonardo-input">
                      <SelectValue placeholder="Select visibility" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="public">Public</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex justify-between border-t border-gray-800 pt-6">
              <Button
                type="button"
                variant="outline"
                className="border-gray-700 bg-gray-800/30 text-white"
                onClick={() => router.push("/projects")}
              >
                Cancel
              </Button>
              <Button type="submit" className="gradient-button" disabled={isSubmitting}>
                <Save className="w-5 h-5 mr-2" />
                {isSubmitting ? "Creating..." : "Create Project"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </main>
    </div>
  )
}

