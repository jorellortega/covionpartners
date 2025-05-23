"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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
  Home,
  ArrowLeft,
  Target,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { useProjects } from "@/hooks/useProjects"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useAuth } from "@/hooks/useAuth"

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

export default function PublicFundingPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const { projects, loading, error } = useProjects()

  // Filter projects that accept donations and match search query
  const fundableProjects = projects?.filter(project =>
    project.accepts_support && (
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
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Button 
                variant="ghost" 
                className="text-gray-400 hover:text-purple-400"
                onClick={() => router.back()}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Discover & Support Innovative Projects</h1>
            <p className="text-gray-400 text-sm sm:text-base">
              Browse and fund projects that inspire you
            </p>
          </div>
          <div className="flex gap-4 w-full sm:w-auto">
            <Button 
              variant="outline" 
              className="border-gray-700 bg-gray-800/30 text-white hover:bg-purple-900/20 hover:text-purple-400 flex-1 sm:flex-none"
              onClick={() => router.push('/')}
            >
              Home
            </Button>
            {user && (
              <Button 
                variant="outline" 
                className="border-gray-700 bg-gray-800/30 text-white hover:bg-purple-900/20 hover:text-purple-400"
                onClick={() => router.push('/dashboard')}
              >
                <Home className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            )}
          </div>
        </div>

        {/* Promotional Section */}
        <Card className="mb-8 bg-gradient-to-r from-purple-900/20 to-purple-500/10 border-purple-500/20">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex-1">
                <h2 className="text-xl font-bold mb-2">Have a Project That Needs Funding?</h2>
                <p className="text-gray-400 mb-4">
                  Create your own project and start receiving donations from our community of supporters.
                  Set your funding goal, share your vision, and watch your project come to life.
                </p>
                <div className="flex flex-wrap gap-3">
                  {!user ? (
                    <Button 
                      onClick={() => router.push('/account-types')}
                      className="bg-purple-500 text-white hover:bg-purple-600"
                    >
                      Get Started
                    </Button>
                  ) : user.role === 'partner' || user.role === 'admin' ? (
                    <Button 
                      onClick={() => router.push('/create-project')}
                      className="bg-purple-500 text-white hover:bg-purple-600"
                    >
                      Create Your Project
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => router.push('/account-types')}
                      className="bg-purple-500 text-white hover:bg-purple-600"
                    >
                      Upgrade Your Account
                    </Button>
                  )}
                  <Button 
                    variant="outline"
                    onClick={() => router.push('/account-types')}
                    className="border-purple-500/50 text-purple-400 hover:bg-purple-900/20"
                  >
                    Learn About Account Types
                  </Button>
                </div>
                {user && (user.role === 'viewer' || user.role === 'investor') && (
                  <p className="text-sm text-purple-400 mt-2">
                    Upgrade to a Partner account to create and manage your own projects
                  </p>
                )}
              </div>
              <div className="hidden md:block">
                <div className="w-48 h-48 bg-purple-500/10 rounded-full flex items-center justify-center">
                  <DollarSign className="w-24 h-24 text-purple-400" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search fundable projects..."
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
          {fundableProjects.map((project) => (
            <Card
              key={project.id}
              className="border-purple-500/20 overflow-visible cursor-pointer hover:border-purple-500/50 transition-colors relative"
              onClick={() => router.push(`/publicprojects/${project.id}`)}
            >
              <CardHeader className="pb-2">
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
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-800/30 rounded-lg">
                      <div className="flex items-center text-gray-400 mb-1">
                        <Target className="w-4 h-4 mr-2" />
                        <span>Goal</span>
                      </div>
                      <div className="text-white font-medium">
                        ${project.funding_goal?.toLocaleString() || '0'}
                      </div>
                    </div>
                    <div className="p-3 bg-gray-800/30 rounded-lg">
                      <div className="flex items-center text-gray-400 mb-1">
                        <Building2 className="w-4 h-4 mr-2" />
                        <span>Type</span>
                      </div>
                      <div className="text-white font-medium">
                        {project.type || 'N/A'}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-purple-500/10 rounded-lg">
                    <div className="flex items-center text-purple-400 mb-1">
                      <DollarSign className="w-4 h-4 mr-2" />
                      <span>Support Progress</span>
                    </div>
                    <div className="text-white font-medium">
                      ${project.current_funding?.toLocaleString() || '0'} raised
                    </div>
                    <div className="mt-2">
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-purple-500 h-2 rounded-full"
                          style={{ 
                            width: `${project.funding_goal && project.current_funding 
                              ? (project.current_funding / project.funding_goal * 100).toFixed(0) 
                              : 0}%` 
                          }}
                        ></div>
                      </div>
                      <div className="text-right text-sm text-purple-400 mt-1">
                        {project.funding_goal && project.current_funding 
                          ? (project.current_funding / project.funding_goal * 100).toFixed(0) 
                          : 0}% funded
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between text-sm">
                    <div className="flex items-center text-gray-400">
                      <Clock className="w-4 h-4 mr-1" />
                      <span>Deadline:</span>
                      <span className="ml-1 text-white">
                        {new Date(project.deadline).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {fundableProjects.length === 0 && (
            <div className="col-span-full text-center py-12">
              <div className="mx-auto w-24 h-24 bg-gray-800/30 rounded-full flex items-center justify-center mb-4">
                <DollarSign className="w-12 h-12 text-purple-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-300 mb-2">
                No fundable projects found
              </h3>
              <p className="text-gray-400">
                {searchQuery
                  ? "Try adjusting your search terms"
                  : "Check back later for new funding opportunities"}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
} 