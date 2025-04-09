"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Home, ArrowLeft, Save, Calendar, Users, DollarSign, Copy, Upload, FileText, Trash2, Loader2 } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useUser } from "@/hooks/useUser"
import { toast } from "sonner"

interface MediaFile {
  name: string
  type: string
  size: number
  url: string
  aspect_ratio: '16:9' | '9:16' | 'square'
  created_at: string
}

export default function NewProjectPage() {
  const router = useRouter()
  const { user, loading } = useUser()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploadingMedia, setIsUploadingMedia] = useState(false)
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [projectData, setProjectData] = useState({
    name: "",
    description: "",
    type: "custom" as "custom" | "other" | "investment" | "collaboration" | "development" | "research" | "consulting" | "marketing" | "education" | "nonprofit" | "startup",
    customType: "",
    status: "pending" as const,
    progress: 0,
    deadline: "",
    budget: "",
    invested: 0,
    roi: 0,
    visibility: "private" as const
  })
  const [projectKey, setProjectKey] = useState('')

  // Generate project key when component mounts
  useEffect(() => {
    setProjectKey('COV-' + Math.random().toString(36).substring(2, 7).toUpperCase())
  }, [])

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [loading, user, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setProjectData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setProjectData((prev) => ({ ...prev, [name]: value }))
  }

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files.length) return

    setIsUploadingMedia(true)
    const files = Array.from(e.target.files)

    try {
      const uploadPromises = files.map(async (file) => {
        // Create a unique filename
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = `projects/temp/${fileName}`

        // Upload file to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('partnerfiles')
          .upload(filePath, file)

        if (uploadError) {
          console.error('Storage upload error:', uploadError)
          throw uploadError
        }

        // Get aspect ratio for images
        let aspectRatio: MediaFile['aspect_ratio'] = '16:9'
        if (file.type.startsWith('image/')) {
          const img = new Image()
          img.src = URL.createObjectURL(file)
          await new Promise((resolve) => {
            img.onload = () => {
              const ratio = img.width / img.height
              if (ratio > 1.7) aspectRatio = '16:9'
              else if (ratio < 0.6) aspectRatio = '9:16'
              else aspectRatio = 'square'
              resolve(null)
            }
          })
        }

        // Get the public URL
        const { data: { publicUrl } } = supabase.storage
          .from('partnerfiles')
          .getPublicUrl(filePath)

        // Create media file record
        const mediaFile: MediaFile = {
          name: fileName,
          type: file.type,
          size: file.size,
          url: publicUrl,
          aspect_ratio: aspectRatio,
          created_at: new Date().toISOString()
        }

        return mediaFile
      })

      const newMediaFiles = await Promise.all(uploadPromises)
      setMediaFiles(prev => [...prev, ...newMediaFiles])
      toast.success('Media files uploaded successfully')

    } catch (error) {
      console.error('Error uploading media:', error)
      toast.error('Failed to upload media files')
    } finally {
      setIsUploadingMedia(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDeleteMedia = (fileName: string) => {
    setMediaFiles(prev => prev.filter(f => f.name !== fileName))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      if (!user?.id) {
        throw new Error("Please sign in to create a project")
      }

      // Get project type - make sure it's a valid enum value
      let projectType = "investment";
      
      // Check if the type selected is one of the valid enum types
      if (["investment", "collaboration", "development", "research", "consulting"].includes(projectData.type)) {
        projectType = projectData.type;
      }
      
      // Modify name if custom type was provided
      let projectName = projectData.name;
      if ((projectData.type === "custom" || projectData.type === "other") && projectData.customType.trim()) {
        projectName = `${projectData.name} (${projectData.customType.trim()})`;
      }

      // Prepare project data
      const insertData: Record<string, any> = {
        name: projectName,
        description: projectData.description || "",
        type: projectType,
        status: "pending",
        progress: 0,
        visibility: projectData.visibility === "private" ? "private" : "public",
        owner_id: user.id,
        project_key: projectKey,
        invested: 0,
        roi: 0,
        media_files: mediaFiles
      };

      // Add deadline if it exists
      if (projectData.deadline && projectData.deadline.trim()) {
        const deadlineDate = new Date(projectData.deadline);
        deadlineDate.setHours(23, 59, 59, 999);
        insertData.deadline = deadlineDate.toISOString();
      }

      // Add budget if it exists
      if (projectData.budget && projectData.budget.trim()) {
        insertData.budget = parseFloat(projectData.budget);
      }

      // Create the project
      const { data, error } = await supabase
        .from('projects')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error('Error creating project:', error);
        throw error;
      }

      // Create team member entry for the owner
      if (data && data.id) {
        const { error: roleError } = await supabase
          .from('team_members')
          .insert([{
            project_id: data.id,
            user_id: user.id,
            role: 'lead',
            status: 'approved',
            joined_at: new Date().toISOString()
          }]);

        if (roleError) {
          console.error('Error creating team member entry:', roleError);
          // Don't throw this error, continue anyway
        }
      }

      toast.success('Project created successfully!');
      router.push("/projects");
    } catch (error: any) {
      console.error("Error creating project:", error);
      toast.error(error.message || "Failed to create project. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
          <p className="mt-4">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render the form if not authenticated
  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen">
      <header className="leonardo-header">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center">
            <Link
              href="/projects"
              className="inline-flex items-center text-white hover:text-blue-300 transition-colors mr-4"
            >
              <ArrowLeft className="w-6 h-6 mr-2" />
              Back to Projects
            </Link>
            <h1 className="text-3xl font-bold">Create New Project</h1>
          </div>
          <Link href="/dashboard" className="inline-flex items-center text-white hover:text-blue-300 transition-colors">
            <Home className="w-6 h-6 mr-2" />
            Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Card className="leonardo-card border-gray-800">
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Project Details</CardTitle>
              <CardDescription className="text-gray-400">
                Fill in the information below to create a new project.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={projectData.name}
                  onChange={handleChange}
                  required
                  className="leonardo-input"
                  placeholder="Enter project name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={projectData.description}
                  onChange={handleChange}
                  className="leonardo-input min-h-[120px]"
                  placeholder="Describe the project goals and scope"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="type">Project Type</Label>
                  <Select
                    name="type"
                    value={projectData.type}
                    onValueChange={(value) => handleSelectChange("type", value)}
                  >
                    <SelectTrigger className="leonardo-input">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="custom" className="focus:bg-purple-500/20 focus:text-purple-400">Custom Type</SelectItem>
                      <SelectItem value="other" className="focus:bg-purple-500/20 focus:text-purple-400">Other</SelectItem>
                      <SelectItem value="investment" className="focus:bg-purple-500/20 focus:text-purple-400">Investment</SelectItem>
                      <SelectItem value="collaboration" className="focus:bg-purple-500/20 focus:text-purple-400">Collaboration</SelectItem>
                      <SelectItem value="development" className="focus:bg-purple-500/20 focus:text-purple-400">Development</SelectItem>
                      <SelectItem value="research" className="focus:bg-purple-500/20 focus:text-purple-400">Research</SelectItem>
                      <SelectItem value="consulting" className="focus:bg-purple-500/20 focus:text-purple-400">Consulting</SelectItem>
                      <SelectItem value="marketing" className="focus:bg-purple-500/20 focus:text-purple-400">Marketing</SelectItem>
                      <SelectItem value="education" className="focus:bg-purple-500/20 focus:text-purple-400">Education</SelectItem>
                      <SelectItem value="nonprofit" className="focus:bg-purple-500/20 focus:text-purple-400">Nonprofit</SelectItem>
                      <SelectItem value="startup" className="focus:bg-purple-500/20 focus:text-purple-400">Startup</SelectItem>
                    </SelectContent>
                  </Select>
                  {(projectData.type === "custom" || projectData.type === "other") && (
                    <div className="mt-2">
                      <Input
                        id="customType"
                        name="customType"
                        value={projectData.customType}
                        onChange={handleChange}
                        className="leonardo-input"
                        placeholder={projectData.type === "custom" ? "Enter custom project type" : "Specify project type"}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="projectKey">Project Key</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="projectKey"
                      value={projectKey}
                      readOnly
                      className="leonardo-input font-mono"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(projectKey);
                        toast.success('Project key copied to clipboard!');
                      }}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">
                    Share this key with team members to allow them to join the project
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deadline">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                      Deadline
                    </div>
                  </Label>
                  <Input
                    id="deadline"
                    name="deadline"
                    type="date"
                    value={projectData.deadline}
                    onChange={handleChange}
                    className="leonardo-input"
                    required
                  />
                  <p className="text-sm text-gray-400 mt-1">Required for project creation. You can update this later.</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="budget">
                    <div className="flex items-center">
                      <DollarSign className="w-4 h-4 mr-2 text-gray-400" />
                      Budget
                    </div>
                  </Label>
                  <Input
                    id="budget"
                    name="budget"
                    type="number"
                    value={projectData.budget}
                    onChange={handleChange}
                    className="leonardo-input"
                    placeholder="Optional"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="visibility">Visibility</Label>
                  <Select
                    name="visibility"
                    value={projectData.visibility}
                    onValueChange={(value) => handleSelectChange("visibility", value)}
                  >
                    <SelectTrigger className="leonardo-input">
                      <SelectValue placeholder="Select visibility" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="public">Public</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Media Section */}
              <div className="space-y-4">
                <Label>Project Media</Label>
                <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center">
                  <Upload className="w-12 h-12 mx-auto text-gray-400" />
                  <p className="mt-2 text-sm text-gray-400">Drag and drop files here, or click to select files</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Supported formats: Images, Videos (Max 10MB each)
                  </p>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="mt-4 border-gray-700 hover:bg-purple-100 hover:text-purple-600 dark:hover:bg-purple-900/20 dark:hover:text-purple-400"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingMedia}
                  >
                    {isUploadingMedia ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4 mr-2" />
                        Add Media
                      </>
                    )}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleMediaUpload}
                  />
                </div>

                {/* Media Preview Grid */}
                {mediaFiles.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {mediaFiles.map((file, index) => (
                      <div key={index} className="relative group">
                        {file.type.startsWith('image/') ? (
                          <div className={`relative overflow-hidden rounded-lg ${
                            file.aspect_ratio === '9:16' ? 'aspect-[9/16]' :
                            file.aspect_ratio === 'square' ? 'aspect-square' :
                            'aspect-[16/9]'
                          }`}>
                            <img
                              src={file.url}
                              alt={file.name}
                              className="object-cover w-full h-full"
                            />
                          </div>
                        ) : file.type.startsWith('video/') ? (
                          <div className={`relative overflow-hidden rounded-lg ${
                            file.aspect_ratio === '9:16' ? 'aspect-[9/16]' :
                            file.aspect_ratio === 'square' ? 'aspect-square' :
                            'aspect-[16/9]'
                          }`}>
                            <video
                              src={file.url}
                              controls
                              className="object-cover w-full h-full"
                            />
                          </div>
                        ) : null}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-white hover:text-red-400"
                            onClick={() => handleDeleteMedia(file.name)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>

            <CardFooter className="flex justify-between border-t border-gray-800 pt-6">
              <Button
                type="button"
                variant="outline"
                className="border-gray-700 bg-gray-800/30 text-white"
                onClick={() => router.push("/projects")}
              >
                Cancel
              </Button>
              <Button type="submit" className="gradient-button" disabled={isSubmitting}>
                <Save className="w-5 h-5 mr-2" />
                {isSubmitting ? "Creating..." : "Create Project"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </main>
    </div>
  )
}

