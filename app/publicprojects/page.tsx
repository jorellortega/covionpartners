"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
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
  Handshake,
  Users,
  Tag,
  FileText,
  ExternalLink,
  Download,
  Settings,
  Heart,
  Eye,
  Globe
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { useProjects } from "@/hooks/useProjects"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useAuth } from "@/hooks/useAuth"
import { QRCodeCanvas } from 'qrcode.react'

interface Project {
  id: string
  name: string
  description: string
  status: string
  type: string
  progress: number
  funding_goal: number
  current_funding: number
  deadline: string
  accepts_donations: boolean
  media_files?: Array<{
    name: string
    type: string
    size: number
    url: string
  }>
  external_links?: Array<{
    title: string
    url: string
  }>
  show_make_deal: boolean
  show_invest: boolean
  show_collaborate: boolean
}

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

export default function PublicProjectsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const { projects, loading, error } = useProjects()

  // Function to ensure URL is properly formatted
  const formatUrl = (url: string) => {
    if (!url) return '#'
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url
    }
    return `https://${url}`
  }

  // Filter projects based on search query only
  const filteredProjects = projects?.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchQuery.toLowerCase())
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
    <div className="flex flex-col min-h-screen bg-gray-950">
      <main className="flex-grow flex flex-col px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto py-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">Public Projects</h1>
              <p className="text-gray-400 text-sm sm:text-base">
                Explore our collection of public investment opportunities
              </p>
            </div>
            <div className="flex gap-4 w-full sm:w-auto">
              <Button 
                variant="outline" 
                className="border-gray-700 bg-gray-800/30 text-white hover:bg-blue-900/20 hover:text-blue-400 flex-1 sm:flex-none"
                onClick={() => router.push('/')}
              >
                Home
              </Button>
              {user && (
                <Button 
                  variant="outline" 
                  className="border-gray-700 bg-gray-800/30 text-white hover:bg-blue-900/20 hover:text-blue-400"
                  onClick={() => router.push('/dashboard')}
                >
                  <Home className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              )}
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search projects..."
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
            {filteredProjects.map((project, index) => {
              // Define different gradient colors for each card
              const gradients = [
                'from-purple-500/10 to-blue-500/10 border-purple-500/20 hover:border-purple-500/40',
                'from-green-500/10 to-cyan-500/10 border-green-500/20 hover:border-green-500/40',
                'from-orange-500/10 to-red-500/10 border-orange-500/20 hover:border-orange-500/40'
              ]
              const gradientClass = gradients[index % gradients.length]
              
              return (
                <Card
                  key={project.id}
                  className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradientClass} transition-all duration-300 cursor-pointer leonardo-card`}
                  onClick={(e) => {
                    // Don't navigate if clicking on a button
                    if (!(e.target as HTMLElement).closest('button')) {
                      router.push(`/publicprojects/${project.id}`);
                    }
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative z-10">
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
                    
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{project.name}</CardTitle>
                        <div className="flex items-center gap-2">
                          {/* Settings Button - Only show if user owns the project */}
                          {user && project.owner_id === user.id && (
                            <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 p-0.5 hover:bg-gray-800/50 text-gray-400 hover:text-purple-400"
                              onClick={(e) => {
                                e.stopPropagation();
                                  router.push(`/projects/${project.id}`);
                              }}
                            >
                              <Settings className="w-3.5 h-3.5" />
                            </Button>
                              <a
                                href={`/publicsettings?project=${project.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={e => e.stopPropagation()}
                                className="h-6 w-6 p-0.5 flex items-center justify-center hover:bg-gray-800/50 text-gray-400 hover:text-blue-400 rounded"
                                title="View Public Settings"
                              >
                                <Eye className="w-4 h-4" />
                              </a>
                              <a
                                href={`/publicprojects/${project.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={e => e.stopPropagation()}
                                className="h-6 w-6 p-0.5 flex items-center justify-center hover:bg-gray-800/50 text-gray-400 hover:text-green-400 rounded"
                                title="View Public Project"
                              >
                                <Globe className="w-4 h-4" />
                              </a>
                            </>
                          )}
                        <StatusBadge status={project.status} />
                        </div>
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
                              <DollarSign className="w-4 h-4 mr-2" />
                              <span>Budget</span>
                            </div>
                            <div className="text-white font-medium">
                              ${project.funding_goal?.toLocaleString() || 'N/A'}
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

                        {project.accepts_donations && (
                          <div className="p-3 bg-purple-500/10 rounded-lg">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center text-purple-400">
                                <DollarSign className="w-4 h-4 mr-2" />
                                <span>Public Funding</span>
                              </div>
                              <span className="text-white font-medium">
                                ${project.current_funding?.toLocaleString() || '0'} / ${project.funding_goal?.toLocaleString() || '0'}
                              </span>
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
                            </div>
                          </div>
                        )}

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-400">Progress</span>
                            <span className="text-white">{project.progress || 0}%</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                              style={{ width: `${project.progress || 0}%` }}
                            ></div>
                          </div>
                        </div>

                        <div className="flex justify-between text-sm">
                          <div className="flex items-center text-gray-400">
                            <Clock className="w-4 h-4 mr-1" />
                            <span>Deadline:</span>
                            <span className="ml-1 text-white">
                              {new Date(project.deadline || '').toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons - Responsive Layout */}
                        {(() => {
                          const actionButtons = [
                            ...(project.show_make_deal ? [{
                              label: 'Make Deal',
                              icon: <Handshake className="w-4 h-4 mr-2" />,
                              onClick: (e: any) => {
                              e.stopPropagation();
                              router.push(`/makedeal?project=${project.id}`);
                              },
                              color: 'hover:bg-purple-900/20 hover:text-purple-400',
                            }] : []),
                            ...(project.show_invest ? [{
                              label: 'Invest',
                              icon: <DollarSign className="w-4 h-4 mr-2" />,
                              onClick: (e: any) => {
                              e.stopPropagation();
                              router.push(`/invest?project=${project.id}`);
                              },
                              color: 'hover:bg-green-900/20 hover:text-green-400',
                            }] : []),
                            ...(project.accepts_donations ? [{
                              label: 'Donate',
                              icon: <Heart className="w-4 h-4 mr-2" />,
                              onClick: (e: any) => {
                              e.stopPropagation();
                              router.push(`/donate?project=${project.id}`);
                              },
                              color: 'hover:bg-pink-900/20 hover:text-pink-400',
                            }] : []),
                            ...(project.show_collaborate ? [{
                              label: 'Collaborate',
                              icon: <Users className="w-4 h-4 mr-2" />,
                              onClick: (e: any) => {
                                e.stopPropagation();
                                router.push(`/collaborations/${project.id}`);
                              },
                              color: 'hover:bg-blue-900/20 hover:text-blue-400',
                            }] : []),
                          ];
                          const gridClass = actionButtons.length > 3 ? 'grid grid-cols-2 gap-2' : 'flex flex-col gap-2';
                          return (
                            <div className={gridClass}>
                              {actionButtons.map((btn, idx) => (
                                <Button
                                  key={btn.label}
                                  variant="outline"
                                  className={`border-gray-700 bg-gray-800/30 text-white ${btn.color} w-full flex items-center justify-center`}
                                  onClick={btn.onClick}
                                >
                                  {btn.icon}
                                  {btn.label}
                        </Button>
                              ))}
                            </div>
                          );
                        })()}

                        {/* Project Resources */}
                        {(project.media_files?.some(file => !file.type.startsWith('image/')) || (project.external_links?.length ?? 0) > 0) && (
                          <div className="mt-4 space-y-2">
                            {/* Downloadable Files */}
                            {project.media_files?.filter(file => !file.type.startsWith('image/')).map((file, index) => (
                              <div 
                                key={index}
                                className="flex items-center justify-between p-2 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="flex items-center space-x-2 min-w-0">
                                  <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                  <span className="text-sm text-gray-300 truncate">{file.name}</span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-gray-400 hover:text-blue-400"
                                  onClick={() => window.open(file.url, '_blank')}
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}

                            {/* External Links */}
                            {project.external_links?.map((link: any, index: number) => (
                              <Button
                                key={index}
                                variant="ghost"
                                size="sm"
                                className="flex items-center gap-2 text-gray-400 hover:text-blue-400 px-2 py-1 text-sm w-fit"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(formatUrl(link.url), '_blank');
                                }}
                                >
                                  <ExternalLink className="w-4 h-4" />
                                Link
                                </Button>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </div>
                </Card>
              )
            })}

            {filteredProjects.length === 0 && (
              <div className="col-span-full text-center py-12">
                <div className="mx-auto w-24 h-24 bg-gray-800/30 rounded-full flex items-center justify-center mb-4">
                  <Building2 className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-300 mb-2">
                  No projects found
                </h3>
                <p className="text-gray-400">
                  {searchQuery
                    ? "Try adjusting your search terms"
                    : "Check back later for new investment opportunities"}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
} 