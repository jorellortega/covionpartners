"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
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
  Clock,
  DollarSign,
  Search,
  Filter,
  SortAsc,
  Tag,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { useProjects } from "@/hooks/useProjects"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Project } from "@/types"

export default function ForSalePage() {
  const router = useRouter()
  const { projects, loading: projectsLoading } = useProjects()
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([])

  useEffect(() => {
    if (projects) {
      const filtered = projects.filter(project => 
        project.accepts_donations && 
        (project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      setFilteredProjects(filtered)
    }
  }, [projects, searchTerm])

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount == null) return "$0"
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  if (projectsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-white">Projects For Sale</h1>
            <p className="mt-2 text-gray-400">
              Browse through available projects open for investment and acquisition
            </p>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search projects..."
                className="pl-10 bg-gray-900 border-gray-800"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Projects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <Card 
                key={project.id} 
                className="bg-gray-900 border-gray-800 hover:border-purple-500/50 transition-colors cursor-pointer"
                onClick={() => router.push(`/publicprojects/${project.id}`)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-white">{project.name}</CardTitle>
                      <CardDescription className="text-gray-400 mt-1">
                        {project.description}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/50">
                      For Sale
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Project Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center text-gray-400">
                        <DollarSign className="w-4 h-4 mr-2" />
                        <span>{formatCurrency(project.funding_goal)}</span>
                      </div>
                      <div className="flex items-center text-gray-400">
                        <Tag className="w-4 h-4 mr-2" />
                        <span>{project.type || 'Not specified'}</span>
                      </div>
                      <div className="flex items-center text-gray-400">
                        <Building2 className="w-4 h-4 mr-2" />
                        <span>{project.status}</span>
                      </div>
                      <div className="flex items-center text-gray-400">
                        <Clock className="w-4 h-4 mr-2" />
                        <span>{new Date(project.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* View Details Button */}
                    <Button 
                      className="w-full gradient-button"
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/publicprojects/${project.id}`)
                      }}
                    >
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* No Results */}
          {filteredProjects.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400">No projects found matching your search criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 