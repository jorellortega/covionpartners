"use client"

import { useAuth } from "@/hooks/useAuth"
import { useUserProjects } from "@/hooks/useUserProjects"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, ArrowRight } from "lucide-react"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"

export default function MyProjectsPage() {
  const { user } = useAuth()
  const { projects, loading, error } = useUserProjects(user?.id || '')

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-gray-800">
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-4" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card className="border-red-500">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (!projects.length) {
    return (
      <div className="container mx-auto py-8">
        <Card className="border-gray-800">
          <CardHeader>
            <CardTitle>No Projects Found</CardTitle>
            <CardDescription>
              You haven't joined or created any projects yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/projects">
                Browse Projects
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">My Projects</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <Card key={project.id} className="border-gray-800">
            <CardHeader>
              <CardTitle>{project.name}</CardTitle>
              <CardDescription>
                {project.description || 'No description available'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={project.owner?.avatar_url || ''} />
                      <AvatarFallback>
                        {project.owner?.name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">Owner</p>
                      <p className="text-xs text-gray-500">
                        {project.owner?.name || 'Unknown'}
                      </p>
                    </div>
                  </div>
                  <Badge variant={project.owner_id === user?.id ? "default" : "secondary"}>
                    {project.owner_id === user?.id ? 'You own this' : 'Team Member'}
                  </Badge>
                </div>

                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-500">
                    {project.teamMembers.length} team members
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {project.teamMembers.slice(0, 3).map((member) => (
                    <Avatar key={member.id} className="h-8 w-8">
                      <AvatarImage src={member.user?.avatar_url || ''} />
                      <AvatarFallback>
                        {member.user?.name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {project.teamMembers.length > 3 && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-800 text-xs">
                      +{project.teamMembers.length - 3}
                    </div>
                  )}
                </div>

                <Button asChild className="w-full">
                  <Link href={`/projects/${project.id}/team`}>
                    View Team
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
} 