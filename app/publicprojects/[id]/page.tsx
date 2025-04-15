"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  Building2,
  Calendar,
  DollarSign,
  Users,
  FileText,
  BarChart2,
  Clock,
  Target,
  CheckCircle,
  AlertCircle,
  Globe,
  Calculator,
  UserPlus,
  Briefcase,
  Download,
  Upload,
  File,
  FileImage,
  FileText as FileTextIcon,
  FileType,
  X,
} from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { useProjects } from "@/hooks/useProjects"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Project } from "@/types"
import { supabase } from "@/lib/supabase"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { QRCodeCanvas } from 'qrcode.react'

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

interface ProjectResource {
  id: string
  name: string
  file_type: string
  size: number
  url: string
  created_at: string
}

export default function PublicProjectDetails() {
  const params = useParams()
  const projectId = params.id as string
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [resources, setResources] = useState<ProjectResource[]>([])
  const [openRoles, setOpenRoles] = useState<any[]>([])
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [resourceName, setResourceName] = useState("")
  const [projectKey, setProjectKey] = useState("")
  const [isJoining, setIsJoining] = useState(false)
  const [joinError, setJoinError] = useState("")
  const qrRef = useRef<any>(null)

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select(`
            *,
            owner:owner_id (
              id,
              name,
              email
            ),
            media_files
          `)
          .eq('id', projectId)
          .single()

        if (error) throw error

        if (data) {
          setProject(data)
        } else {
          setError("Project not found")
        }
      } catch (err: any) {
        setError(err.message || "Failed to load project")
        console.error("Error fetching project:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchProject()
  }, [projectId])

  // Fetch project resources
  useEffect(() => {
    const fetchResources = async () => {
      try {
        const { data, error } = await supabase
          .from('project_resources')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false })

        if (error) throw error
        setResources(data || [])
      } catch (err) {
        console.error('Error fetching resources:', err)
      }
    }

    if (projectId) {
      fetchResources()
    }
  }, [projectId])

  // Fetch open roles
  useEffect(() => {
    const fetchOpenRoles = async () => {
      try {
        const { data, error } = await supabase
          .from('project_open_roles')
          .select('*')
          .eq('project_id', projectId)
          .eq('status', 'open')
          .order('created_at', { ascending: true })

        if (error) throw error
        setOpenRoles(data || [])
      } catch (err) {
        console.error('Error fetching open roles:', err)
      }
    }

    if (projectId) {
      fetchOpenRoles()
    }
  }, [projectId])

  // Handle file upload
  const handleUpload = async () => {
    if (!selectedFile || !resourceName) return

    setUploading(true)
    try {
      // Upload file to Supabase Storage in the project-resources subfolder
      const fileExt = selectedFile.name.split('.').pop()
      const fileName = `project-resources/${projectId}/${Date.now()}.${fileExt}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('partnerfiles')
        .upload(fileName, selectedFile)

      if (uploadError) throw uploadError

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('partnerfiles')
        .getPublicUrl(fileName)

      // Save resource metadata to database
      const { data: resource, error: dbError } = await supabase
        .from('project_resources')
        .insert({
          project_id: projectId,
          name: resourceName,
          file_type: fileExt,
          size: selectedFile.size,
          url: publicUrl,
        })
        .select()
        .single()

      if (dbError) throw dbError

      setResources(prev => [resource, ...prev])
      setIsUploadOpen(false)
      setSelectedFile(null)
      setResourceName("")
      toast.success("Resource uploaded successfully")
    } catch (err) {
      console.error('Error uploading:', err)
      toast.error("Failed to upload resource")
    } finally {
      setUploading(false)
    }
  }

  // Handle file download
  const handleDownload = async (resource: ProjectResource) => {
    try {
      const response = await fetch(resource.url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = resource.name
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Error downloading:', err)
      toast.error("Failed to download resource")
    }
  }

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
  }

  // Safely format date strings
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString()
    } catch (error) {
      return 'Invalid date'
    }
  }

  // Safely format numbers
  const formatNumber = (num: number) => {
    try {
      return num.toLocaleString()
    } catch (error) {
      return '0'
    }
  }

  const handleJoinProject = async () => {
    if (!projectKey.trim() || !user?.id) return;
    
    setIsJoining(true)
    setJoinError("")
    
    try {
      // Find the project with this key
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('id')
        .eq('project_key', projectKey.trim())
        .single()

      if (projectError || !projectData) {
        throw new Error('Invalid project key')
      }

      // Add user as team member
      const { error: joinError } = await supabase
        .from('team_members')
        .insert([{
          project_id: projectData.id,
          user_id: user.id,
          role: 'member',
          status: 'pending',
          joined_at: new Date().toISOString()
        }])

      if (joinError) throw joinError

      // Show success message
      toast.success('Join request sent successfully!')
      
      // Clear the input
      setProjectKey("")
    } catch (error: any) {
      console.error('Error joining project:', error)
      setJoinError(error.message || 'Failed to join project')
      toast.error('Failed to join project')
    } finally {
      setIsJoining(false)
    }
  }

  const handleDownloadQR = () => {
    if (!qrRef.current) return;
    // Create a hidden canvas for high-res export
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 1200;
    tempCanvas.height = 1200;
    const ctx = tempCanvas.getContext('2d');
    // Render QR code to temp canvas
    const svg = qrRef.current.querySelector('canvas');
    if (svg) {
      // Draw the existing canvas onto the temp canvas, scaling up
      ctx.drawImage(svg, 0, 0, 1200, 1200);
      const url = tempCanvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `project-qr-${project.id}.png`;
      a.click();
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size={40} />
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || "Project not found"}</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="leonardo-header">
        <div className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col space-y-4">
            <Button 
              variant="ghost" 
              className="text-gray-400 hover:text-purple-400 w-fit"
              onClick={() => router.push('/publicprojects')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Public Projects
            </Button>
            
            <div className="flex flex-col space-y-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white break-words">{project.name}</h1>
                <p className="text-gray-400 text-sm sm:text-base mt-1">{project.description || 'No description available'}</p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 sm:items-center">
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50 w-fit">
                  <Globe className="w-4 h-4 mr-2" />
                  Public Project
                </Badge>
                <StatusBadge status={project.status || 'Unknown'} />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Project Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Media Files Section */}
            <Card className="leonardo-card border-gray-800">
              <CardHeader>
                <CardTitle>Media Files</CardTitle>
                <CardDescription>Project media and documentation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {project?.media_files?.map((file, index) => (
                    <Card key={index} className="overflow-hidden">
                      {file.type.startsWith('image/') ? (
                        <div className="relative aspect-video">
                          <img
                            src={file.url}
                            alt={file.name}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="aspect-video bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                          <FileType className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                      <CardContent className="p-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {formatFileSize(file.size)}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                  {(!project?.media_files || project.media_files.length === 0) && (
                    <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
                      No media files available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Project Description */}
            <Card className="leonardo-card border-gray-800">
              <CardHeader>
                <CardTitle>Project Description</CardTitle>
                <CardDescription className="text-gray-400">
                  Detailed overview of the project
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose prose-invert max-w-none">
                  <p className="text-gray-300 leading-relaxed">
                    {project.description || 'No description available.'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Project Resources */}
            <Card className="leonardo-card border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Project Resources
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Available documents and materials
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {resources.length === 0 ? (
                    <div className="text-center py-8">
                      <File className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400">No resources available yet</p>
                    </div>
                  ) : (
                    resources.map((resource) => (
                      <div key={resource.id} className="p-4 bg-gray-800/30 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <FileType className="w-8 h-8 text-blue-400 mr-3" />
                            <div>
                              <h4 className="font-medium text-white">{resource.name}</h4>
                              <p className="text-sm text-gray-400">
                                {resource.file_type.toUpperCase()} • {formatFileSize(resource.size)}
                              </p>
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="text-gray-400 hover:text-white"
                            onClick={() => handleDownload(resource)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}

                  {/* Upload section - only visible to project owner */}
                  {user && project.owner_id === user.id && (
                    <div className="mt-6 border-t border-gray-800 pt-6">
                      <Button 
                        className="w-full gradient-button"
                        onClick={() => setIsUploadOpen(true)}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload New Resource
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Project Overview */}
            <Card className="leonardo-card border-gray-800">
              <CardHeader>
                <CardTitle>Project Overview</CardTitle>
                <CardDescription className="text-gray-400">
                  Key details and progress of the project
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-800/30 rounded-lg">
                      <div className="flex items-center text-gray-400 mb-2">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>Created</span>
                      </div>
                      <div className="text-white font-medium">
                        {formatDate(project.created_at)}
                      </div>
                    </div>
                    <div className="p-4 bg-gray-800/30 rounded-lg">
                      <div className="flex items-center text-gray-400 mb-2">
                        <Clock className="w-4 h-4 mr-2" />
                        <span>Deadline</span>
                      </div>
                      <div className="text-white font-medium">
                        {formatDate(project.deadline)}
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
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
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-800/30 rounded-lg">
                      <div className="flex items-center text-gray-400 mb-2">
                        <DollarSign className="w-4 h-4 mr-2" />
                        <span>Budget</span>
                      </div>
                      <div className="text-white font-medium">
                        {project.budget ? `$${formatNumber(project.budget)}` : 'Not set'}
                      </div>
                    </div>
                    <div className="p-4 bg-gray-800/30 rounded-lg">
                      <div className="flex items-center text-gray-400 mb-2">
                        <Building2 className="w-4 h-4 mr-2" />
                        <span>Type</span>
                      </div>
                      <div className="text-white font-medium">{project.type || 'Unknown'}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Upload Modal */}
            <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Resource</DialogTitle>
                  <DialogDescription>
                    Add a new resource to the project
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Resource Name</Label>
                    <Input
                      placeholder="Enter resource name"
                      value={resourceName}
                      onChange={(e) => setResourceName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>File</Label>
                    <div className="border-2 border-dashed border-gray-800 rounded-lg p-4">
                      <Input
                        type="file"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                        className="hidden"
                        id="file-upload"
                      />
                      <label
                        htmlFor="file-upload"
                        className="cursor-pointer flex flex-col items-center justify-center"
                      >
                        {selectedFile ? (
                          <div className="flex items-center">
                            <FileType className="w-6 h-6 text-blue-400 mr-2" />
                            <span className="text-white">{selectedFile.name}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="ml-2"
                              onClick={(e) => {
                                e.preventDefault()
                                setSelectedFile(null)
                              }}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-8 h-8 text-gray-400 mb-2" />
                            <p className="text-sm text-gray-400">
                              Click to select a file or drag and drop
                            </p>
                          </>
                        )}
                      </label>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsUploadOpen(false)}
                    disabled={uploading}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="gradient-button"
                    onClick={handleUpload}
                    disabled={!selectedFile || !resourceName || uploading}
                  >
                    {uploading ? (
                      <>
                        <LoadingSpinner className="w-4 h-4 mr-2" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {typeof window !== 'undefined' && localStorage.getItem('showQRCodes') !== 'false' && project && (
              <Card className="leonardo-card border-gray-800">
                <CardHeader>
                  <CardTitle>Share this Project</CardTitle>
                  <CardDescription>Scan to open this public project page</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center py-6">
                  <div ref={qrRef}>
                    <QRCodeCanvas value={`${window.location.origin}/publicprojects/${project.id}`} size={256} />
                  </div>
                  <Button className="mt-4" onClick={handleDownloadQR}>
                    Download QR Code
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Team Roles */}
            <Card className="leonardo-card border-gray-800">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Briefcase className="w-5 h-5 mr-2" />
                  Open Positions
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Roles we're looking to fill
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {openRoles.length === 0 ? (
                    <div className="text-center py-8">
                      <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400">No open positions at the moment</p>
                    </div>
                  ) : (
                    openRoles.map((role) => (
                      <div key={role.id} className="p-4 bg-gray-800/30 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium text-white">{role.role_name}</h4>
                            <p className="text-sm text-gray-400">{role.description}</p>
                          </div>
                          <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/50">
                            {role.positions_needed} needed
                          </Badge>
                        </div>
                        <Button 
                          className="w-full mt-2 gradient-button"
                          onClick={() => {
                            if (!user) {
                              router.push(`/login?redirect=/publicprojects/${project.id}`)
                              return
                            }
                            router.push(`/publicprojects/${project.id}/apply?role=${role.id}&roleName=${encodeURIComponent(role.role_name)}`)
                          }}
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          Apply for Role
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Project Stats */}
            <Card className="leonardo-card border-gray-800">
              <CardHeader>
                <CardTitle>Project Stats</CardTitle>
                <CardDescription className="text-gray-400">
                  Key metrics and statistics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-gray-800/30 rounded-lg">
                    <div className="flex items-center text-gray-400 mb-2">
                      <Users className="w-4 h-4 mr-2" />
                      <span>Owner</span>
                    </div>
                    <div className="text-white font-medium">
                      {project.owner?.name || 'Unknown'}
                    </div>
                  </div>
                  <div className="p-4 bg-gray-800/30 rounded-lg">
                    <div className="flex items-center text-gray-400 mb-2">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>Last Updated</span>
                    </div>
                    <div className="text-white font-medium">
                      {formatDate(project.updated_at)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            {user ? (
              <Card className="leonardo-card border-gray-800">
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                  <CardDescription className="text-gray-400">
                    Available actions for this project
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Button 
                      className="w-full gradient-button"
                      onClick={() => router.push(`/projects/${project.id}`)}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      View Full Details
                    </Button>
                    <Button 
                      className="w-full gradient-button"
                      onClick={() => router.push(`/calculator?project=${project.id}`)}
                    >
                      <Calculator className="w-4 h-4 mr-2" />
                      Calculate Investment
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="leonardo-card border-gray-800">
                <CardHeader>
                  <CardTitle>Join Project</CardTitle>
                  <CardDescription className="text-gray-400">
                    Sign in to apply for roles or calculate investments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    className="w-full gradient-button"
                    onClick={() => router.push(`/login?redirect=/publicprojects/${project.id}`)}
                  >
                    Sign In to Join
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Join Project Card */}
            {user ? (
            <Card className="leonardo-card border-gray-800">
              <CardHeader>
                <CardTitle>Join this Project</CardTitle>
                <CardDescription>Enter the project key to request access</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div className="flex-grow">
                    <Input
                      placeholder="Enter project key (e.g., COV-ABC12)"
                      value={projectKey}
                      onChange={(e) => setProjectKey(e.target.value)}
                      className="bg-gray-800/30 border-gray-700"
                    />
                  </div>
                  <Button 
                    className="gradient-button" 
                    onClick={handleJoinProject}
                    disabled={isJoining || !projectKey.trim()}
                  >
                    {isJoining ? 'Requesting Access...' : 'Request to Join'}
                  </Button>
                </div>
                {joinError && (
                  <div className="mt-2 text-sm text-red-500">{joinError}</div>
                )}
              </CardContent>
            </Card>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  )
} 