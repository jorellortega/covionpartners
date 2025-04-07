'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Project, ProjectRole } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Mail, Phone, User } from 'lucide-react'
import Link from 'next/link'

interface TeamMember extends ProjectRole {
  user: {
    id: string
    email: string
    full_name: string
    avatar_url?: string
  }
}

export default function ViewTeamPage() {
  const params = useParams()
  const projectId = params.id as string
  const [project, setProject] = useState<Project | null>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

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
  }, [projectId, supabase])

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
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <p className="text-muted-foreground">Project Team Members</p>
        </div>
        <Link href={`/projects/${projectId}`}>
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Project
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {teamMembers.map((member) => (
          <Card key={member.user.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={member.user.avatar_url || ''} />
                <AvatarFallback>
                  {member.user.full_name
                    ? member.user.full_name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                    : member.user.email[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-xl">
                  {member.user.full_name || member.user.email}
                </CardTitle>
                <Badge variant="secondary" className="mt-1">
                  {member.role_name}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {member.description}
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  <a
                    href={`mailto:${member.user.email}`}
                    className="hover:text-primary"
                  >
                    {member.user.email}
                  </a>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>Status: {member.status}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {teamMembers.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium">No team members yet</h3>
          <p className="text-muted-foreground">
            This project doesn't have any team members assigned yet.
          </p>
        </div>
      )}
    </div>
  )
} 