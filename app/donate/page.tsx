"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Building2,
  Search,
  Filter,
  SortAsc,
  DollarSign,
  Heart,
  ArrowLeft,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { useProjects } from "@/hooks/useProjects"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { DevelopmentBanner } from "@/components/ui/development-banner"

// Project status badge component
function StatusBadge({ status }: { status: string }) {
  const getStatusStyles = () => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-500/20 text-green-400 border-green-500/50"
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
      case "completed":
        return "bg-blue-500/20 text-blue-400 border-blue-500/50"
      case "on hold":
        return "bg-red-500/20 text-red-400 border-red-500/50"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/50"
    }
  }

  return (
    <Badge className={`${getStatusStyles()} border`} variant="outline">
      {status}
    </Badge>
  )
}

export default function DonatePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState("")
  const { projects, loading, error } = useProjects()

  // If project ID is provided in URL, redirect to the specific donation page
  const projectId = searchParams.get('project')
  if (projectId) {
    router.push(`/donate/${projectId}`)
    return null
  }

  // Filter projects that accept donations and match search query
  const filteredProjects = projects?.filter(project =>
    project.accepts_donations && (
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  ) || []

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-red-500">Error loading projects: {error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <DevelopmentBanner />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
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
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">Support Projects</h1>
              <p className="text-gray-400 text-sm sm:text-base">
                Make a difference by supporting innovative projects
              </p>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search projects accepting donations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="border-gray-700 bg-gray-800/30 text-white">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline" className="border-gray-700 bg-gray-800/30 text-white">
              <SortAsc className="h-4 w-4 mr-2" />
              Sort
            </Button>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Card
              key={project.id}
              className="leonardo-card border-gray-800 cursor-pointer hover:border-pink-500/50 transition-colors"
              onClick={() => router.push(`/donate/${project.id}`)}
            >
              {/* Project Thumbnail */}
              <div className="w-full aspect-video relative">
                {project.media_files && project.media_files.length > 0 ? (
                  <Image
                    src={project.media_files[0].url}
                    alt={project.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-800/50 flex items-center justify-center">
                    <Building2 className="w-16 h-16 text-purple-400/50" />
                  </div>
                )}
              </div>

              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  <StatusBadge status={project.status} />
                </div>
                <CardDescription className="text-gray-400 line-clamp-2">
                  {project.description || 'No description available'}
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  {/* Funding Progress */}
                  <div className="p-3 bg-pink-500/10 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-pink-400">
                        <Heart className="w-4 h-4 mr-2" />
                        <span>Donations Received</span>
                      </div>
                      <span className="text-white font-medium">
                        ${project.current_funding?.toLocaleString() || '0'} / ${project.funding_goal?.toLocaleString() || '0'}
                      </span>
                    </div>
                    <div className="mt-2">
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-pink-500 h-2 rounded-full"
                          style={{ 
                            width: `${project.funding_goal && project.current_funding 
                              ? (project.current_funding / project.funding_goal * 100).toFixed(0) 
                              : 0}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Donate Button */}
                  <Button 
                    className="w-full bg-pink-600 hover:bg-pink-700"
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/donate/${project.id}`)
                    }}
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    Support This Project
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredProjects.length === 0 && (
            <div className="col-span-full text-center py-12">
              <div className="mx-auto w-24 h-24 bg-gray-800/30 rounded-full flex items-center justify-center mb-4">
                <Heart className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-300 mb-2">
                No projects found
              </h3>
              <p className="text-gray-400">
                {searchQuery
                  ? "Try adjusting your search terms"
                  : "Check back later for projects accepting donations"}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
} 