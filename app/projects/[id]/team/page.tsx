"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Mail, Plus } from "lucide-react"
import { Project } from "@/types"
import { supabase } from "@/lib/supabase"
import { useTeamMembers } from "@/hooks/useTeamMembers"
import { toast } from "sonner"
import { useAuth } from "@/hooks/useAuth"

export default function ViewTeamPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const projectId = params.id as string
  const [project, setProject] = useState<Project | null>(null)
  const [isOwner, setIsOwner] = useState(false)
  const { teamMembers, loading: loadingTeam, error: teamError } = useTeamMembers(projectId)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProject() {
      try {
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .single()

        if (projectError) throw projectError
        setProject(projectData)
        setIsOwner(projectData.owner_id === user?.id)
      } catch (error) {
        console.error('Error fetching project:', error)
        toast.error('Failed to load project details')
      } finally {
        setLoading(false)
      }
    }

    if (projectId) {
      fetchProject()
    }
  }, [projectId, user?.id])

  if (loading || loadingTeam) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (teamError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4 text-red-500">Error loading team members</h1>
        <p className="text-gray-400 mb-4">{teamError}</p>
        <Link href="/projects">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Button>
        </Link>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Project not found</h1>
        <Link href="/projects">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <Link href={`/projects/${projectId}`}>
            <Button variant="ghost" className="text-gray-400 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Project
            </Button>
          </Link>
          {isOwner && (
            <Button 
              onClick={() => router.push(`/projects/${projectId}/team/invite`)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Invite Team Member
            </Button>
          )}
        </div>

        <Card className="leonardo-card border-gray-800">
          <CardHeader>
            <CardTitle className="text-2xl">{project.name} - Team</CardTitle>
            <CardDescription>
              View all team members and their roles
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teamMembers.length === 0 ? (
                <div className="col-span-full text-center py-8">
                  <p className="text-gray-400">No team members assigned yet</p>
                  {isOwner && (
                    <Button 
                      onClick={() => router.push(`/projects/${projectId}/team/invite`)}
                      variant="outline" 
                      className="mt-4"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Invite Team Member
                    </Button>
                  )}
                </div>
              ) : (
                teamMembers.map((member) => (
                  <Card key={member.id} className="bg-gray-800/30 border-gray-700">
                    <CardContent className="pt-6">
                      <div className="flex items-start space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={member.user.avatar_url || undefined} />
                          <AvatarFallback>
                            {member.user.name?.split(' ').map(n => n[0]).join('') || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {member.user.name || 'Unnamed User'}
                          </p>
                          <Badge variant="outline" className="mt-1">
                            {member.role}
                          </Badge>
                          <div className="mt-2 flex flex-col space-y-1">
                            <a
                              href={`mailto:${member.user.email}`}
                              className="flex items-center text-sm text-gray-400 hover:text-white"
                            >
                              <Mail className="h-4 w-4 mr-2" />
                              {member.user.email}
                            </a>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
} 