"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Send, Briefcase } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function ApplyForRolePage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  const projectId = params.id as string
  const roleId = searchParams.get('role')
  const roleName = searchParams.get('roleName')
  
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [project, setProject] = useState<any>(null)
  const [formData, setFormData] = useState({
    coverLetter: "",
    experience: "",
    socialLinks: "",
    portfolioUrl: "",
  })

  useEffect(() => {
    // Only redirect if we're sure the user is not authenticated
    if (!authLoading && !user) {
      router.push(`/login?redirect=/publicprojects/${projectId}/apply?role=${roleId}&roleName=${roleName}`)
      return
    }

    // Don't fetch project data until we confirm user is authenticated
    if (authLoading || !user) return

    const fetchProject = async () => {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .single()

        if (error) throw error
        setProject(data)
      } catch (err) {
        console.error('Error fetching project:', err)
        toast.error("Failed to load project details")
      } finally {
        setLoading(false)
      }
    }

    fetchProject()
  }, [projectId, user, router, roleId, roleName, authLoading])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      toast.error("Please sign in to apply")
      return
    }

    setSubmitting(true)
    try {
      // Check if user has already applied for this role
      const { data: existingApplication } = await supabase
        .from('project_role_applications')
        .select('*')
        .eq('project_id', projectId)
        .eq('role_id', roleId)
        .eq('user_id', user.id)
        .single()

      if (existingApplication) {
        toast.error("You have already applied for this role")
        return
      }

      // Insert the application into the project_role_applications table
      const { error } = await supabase
        .from('project_role_applications')
        .insert({
          project_id: projectId,
          role_id: roleId,
          user_id: user.id,
          role_name: roleName,
          cover_letter: formData.coverLetter,
          experience: formData.experience,
          social_links: formData.socialLinks,
          portfolio_url: formData.portfolioUrl,
          status: 'pending'
        })

      if (error) throw error

      toast.success("Application submitted successfully!")
      router.push(`/publicprojects/${projectId}`)
    } catch (err) {
      console.error('Error submitting application:', err)
      toast.error("Failed to submit application")
    } finally {
      setSubmitting(false)
    }
  }

  // Show loading spinner while auth is being checked
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  // Show not found state if no project is found
  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-red-500">Project not found</p>
          <Button 
            className="mt-4"
            onClick={() => router.push('/publicprojects')}
          >
            Back to Projects
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Button 
          variant="ghost" 
          className="text-gray-400 hover:text-white mb-4"
          onClick={() => router.push(`/publicprojects/${projectId}`)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Project
        </Button>

        <Card className="leonardo-card border-gray-800">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Briefcase className="w-5 h-5 text-blue-400" />
              <CardTitle>Apply for Role: {roleName}</CardTitle>
            </div>
            <CardDescription>
              Project: {project.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="coverLetter">Cover Letter</Label>
                <Textarea
                  id="coverLetter"
                  placeholder="Tell us why you're interested in this role and what you can bring to the team..."
                  value={formData.coverLetter}
                  onChange={(e) => setFormData({ ...formData, coverLetter: e.target.value })}
                  className="h-32"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="experience">Relevant Experience</Label>
                <Textarea
                  id="experience"
                  placeholder="Describe your relevant experience for this role..."
                  value={formData.experience}
                  onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                  className="h-32"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="socialLinks">Social Links (Optional)</Label>
                <Input
                  id="socialLinks"
                  type="text"
                  placeholder="https://twitter.com/yourprofile, https://linkedin.com/in/your-profile, etc."
                  value={formData.socialLinks}
                  onChange={(e) => setFormData({ ...formData, socialLinks: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="portfolioUrl">Portfolio/Website URL (Optional)</Label>
                <Input
                  id="portfolioUrl"
                  type="url"
                  placeholder="https://your-portfolio.com"
                  value={formData.portfolioUrl}
                  onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/publicprojects/${projectId}`)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="gradient-button"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <LoadingSpinner className="w-4 h-4 mr-2" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Application
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
} 