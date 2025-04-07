"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
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
import { ArrowLeft, Mail, Phone } from "lucide-react"
import { Project } from "@/types"
import supabase from "@/utils/supabase/client"

interface TeamMember {
  id: string
  project_id: string
  user_id: string
  role_name: string
  description: string
  status: string
  user: {
    id: string
    email: string
    full_name: string
    avatar_url: string | null
  }
}

export default function ViewTeamPage() {
  const params = useParams()
  const projectId = params.id as string
  const [project, setProject] = useState<Project | null>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProjectAndTeam() {
      try {
        // Fetch project details
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .single()

        if (projectError) throw projectError
        setProject(projectData)

        // Fetch team members with their roles
        const { data: rolesData, error: rolesError } = await supabase
          .from('project_roles')
          .select(`
            *,
            user:user_id (
              id,
              email,
              full_name,
              avatar_url
            )
          `)
          .eq('project_id', projectId)

        if (rolesError) throw rolesError
        setTeamMembers(rolesData as TeamMember[])
      } catch (error) {
        console.error('Error fetching project team:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProjectAndTeam()
  }, [projectId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
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
                </div>
              ) : (
                teamMembers.map((member) => (
                  <Card key={member.id} className="bg-gray-800/30 border-gray-700">
                    <CardContent className="pt-6">
                      <div className="flex items-start space-x-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={member.user.avatar_url || '/placeholder-user.jpg'} />
                          <AvatarFallback>
                            {member.user.full_name?.split(' ').map(n => n[0]).join('') || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {member.user.full_name}
                          </p>
                          <Badge variant="outline" className="mt-1">
                            {member.role_name}
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