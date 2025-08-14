"use client"

import React, { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FileText, Download, UploadCloud, Share2, Copy, CheckCircle, AlertCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

interface FileShare {
  id: string
  file_name: string
  file_url: string
  file_size: number
  file_type: string
  message: string
  sender_name: string
  sender_email: string
  expires_at: string
  created_at: string
  download_count: number
}

export default function FileDownloadPage() {
  const [uploading, setUploading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [fileInput, setFileInput] = useState<HTMLInputElement | null>(null)
  const [formData, setFormData] = useState({
    expiresIn: '7'
  })
  const [shareLink, setShareLink] = useState('')
  const [copied, setCopied] = useState(false)
  const [fileInfo, setFileInfo] = useState<{
    name: string
    size: number
    type: string
  } | null>(null)
  
  // New state for project file selection
  const [fileSource, setFileSource] = useState<'upload' | 'project'>('upload')
  const [projects, setProjects] = useState<Array<{id: string, name: string}>>([])
  const [selectedProject, setSelectedProject] = useState('')
  const [projectFiles, setProjectFiles] = useState<Array<{
    id: string
    name: string
    url: string
    type: string
    size: number
    custom_label?: string
  }>>([])
  const [selectedProjectFile, setSelectedProjectFile] = useState('')
  const [loadingProjects, setLoadingProjects] = useState(false)
  const [loadingFiles, setLoadingFiles] = useState(false)

  // Fetch user's projects
  const fetchProjects = async () => {
    try {
      setLoadingProjects(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get projects where user is owner
      const { data: ownedProjects, error: ownedError } = await supabase
        .from('projects')
        .select('id, name')
        .eq('owner_id', user.id)
        .order('name')

      if (ownedError) throw ownedError

      // Get projects where user is team member
      const { data: teamMemberships, error: teamError } = await supabase
        .from('team_members')
        .select('project_id')
        .eq('user_id', user.id)
        .eq('status', 'active')

      if (teamError) throw teamError

      const teamProjectIds = teamMemberships?.map(tm => tm.project_id) || []

      if (teamProjectIds.length > 0) {
        const { data: teamProjects, error: teamProjectsError } = await supabase
          .from('projects')
          .select('id, name')
          .in('id', teamProjectIds)
          .order('name')

        if (teamProjectsError) throw teamProjectsError

        // Combine and deduplicate
        const allProjects = [...(ownedProjects || []), ...(teamProjects || [])]
        const uniqueProjects = allProjects.filter((project, index, self) =>
          index === self.findIndex(p => p.id === project.id)
        )
        setProjects(uniqueProjects)
      } else {
        setProjects(ownedProjects || [])
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
      toast.error('Failed to load projects')
    } finally {
      setLoadingProjects(false)
    }
  }

  // Fetch files for selected project
  const fetchProjectFiles = async (projectId: string) => {
    try {
      setLoadingFiles(true)
      const { data, error } = await supabase
        .from('project_files')
        .select('id, name, url, type, size, custom_label')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setProjectFiles(data || [])
    } catch (error) {
      console.error('Error fetching project files:', error)
      toast.error('Failed to load project files')
    } finally {
      setLoadingFiles(false)
    }
  }

  // Handle project selection change
  const handleProjectChange = (projectId: string) => {
    setSelectedProject(projectId)
    setSelectedProjectFile('')
    if (projectId) {
      fetchProjectFiles(projectId)
    } else {
      setProjectFiles([])
    }
  }

  // Handle project file selection
  const handleProjectFileSelect = (fileId: string) => {
    const file = projectFiles.find(f => f.id === fileId)
    if (file) {
      setFileInfo({
        name: file.custom_label || file.name,
        size: file.size || 0,
        type: file.type || 'application/octet-stream'
      })
      setSelectedProjectFile(fileId)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (50MB limit)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('File size must be less than 50MB')
      return
    }

    setFileInfo({
      name: file.name,
      size: file.size,
      type: file.type
    })
  }

  const handleUpload = async () => {
    if (fileSource === 'upload' && !fileInput?.files?.[0]) {
      toast.error('Please select a file to upload')
      return
    }

    if (fileSource === 'project' && !selectedProjectFile) {
      toast.error('Please select a project file')
      return
    }

    setUploading(true)

    try {
      let fileUrl: string
      let fileName: string
      let fileSize: number
      let fileType: string

      if (fileSource === 'upload') {
        // Handle new file upload
        const file = fileInput!.files![0]
        
        // Validate file size (50MB limit)
        if (file.size > 50 * 1024 * 1024) {
          toast.error('File size must be less than 50MB')
          return
        }

        // Generate unique filename
        const fileExt = file.name.split('.').pop()
        const uniqueFileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `public_shares/${uniqueFileName}`

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('partnerfiles')
          .upload(filePath, file)

        if (uploadError) {
          throw uploadError
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('partnerfiles')
          .getPublicUrl(filePath)

        fileUrl = publicUrl
        fileName = file.name
        fileSize = file.size
        fileType = file.type
      } else {
        // Handle project file selection
        const selectedFile = projectFiles.find(f => f.id === selectedProjectFile)
        if (!selectedFile) {
          throw new Error('Selected project file not found')
        }

        fileUrl = selectedFile.url
        fileName = selectedFile.custom_label || selectedFile.name
        fileSize = selectedFile.size || 0
        fileType = selectedFile.type || 'application/octet-stream'
      }

      // Calculate expiration date
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + parseInt(formData.expiresIn))

      // Create file share record
      const { data, error: insertError } = await supabase
        .from('file_shares')
        .insert({
          file_name: fileName,
          file_url: fileUrl,
          file_size: fileSize,
          file_type: fileType,
          message: '', // No message needed
          sender_name: 'File Owner', // Default sender name
          sender_email: 'noreply@covionpartners.com', // Default email
          expires_at: expiresAt.toISOString(),
          download_count: 0
        })
        .select()
        .single()

      if (insertError) {
        throw insertError
      }

      // Generate direct share link
      const shareUrl = `${window.location.origin}/file-download/${data.id}`
      setShareLink(shareUrl)

      // Reset form
      setFormData({
        expiresIn: '7'
      })
      setFileInfo(null)
      setSelectedProjectFile('')
      if (fileInput) fileInput.value = ''

      toast.success('File shared successfully! Share the link with others.')
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to share file. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareLink)
      setCopied(true)
      toast.success('Link copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy link')
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Fetch projects on component mount
  useEffect(() => {
    fetchProjects()
  }, [])

  return (
    <div className="min-h-screen bg-gray-950">
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            File Share & Download
          </h1>
          <p className="text-xl text-gray-400">
            Generate direct download links for your files. Simple and straightforward.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <Card className="leonardo-card border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <UploadCloud className="w-6 h-6 mr-2 text-blue-400" />
                Share a File
              </CardTitle>
              <CardDescription className="text-gray-400">
                Upload a new file or select from your project files to generate a direct download link
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* File Source Toggle */}
              <div>
                <Label className="text-white">File Source</Label>
                <div className="mt-2 flex gap-2">
                  <Button
                    type="button"
                    variant={fileSource === 'upload' ? 'default' : 'outline'}
                    onClick={() => setFileSource('upload')}
                    className={`flex-1 ${fileSource === 'upload' ? 'bg-blue-600 hover:bg-blue-700' : 'border-gray-600 text-gray-300 hover:bg-gray-800'}`}
                  >
                    <UploadCloud className="w-4 h-4 mr-2" />
                    Upload New File
                  </Button>
                  <Button
                    type="button"
                    variant={fileSource === 'project' ? 'default' : 'outline'}
                    onClick={() => setFileSource('project')}
                    className={`flex-1 ${fileSource === 'project' ? 'bg-blue-600 hover:bg-blue-700' : 'border-gray-600 text-gray-300 hover:bg-gray-800'}`}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Select from Projects
                  </Button>
                </div>
              </div>

              {/* File Selection */}
              <div>
                <Label htmlFor="file" className="text-white">
                  {fileSource === 'upload' ? 'Select File' : 'Select Project File'}
                </Label>
                
                {fileSource === 'upload' ? (
                  // Upload new file
                  <div className="mt-2">
                    <input
                      ref={setFileInput}
                      type="file"
                      id="file"
                      onChange={handleFileSelect}
                      className="hidden"
                      accept="*/*"
                    />
                    <Button
                      variant="outline"
                      onClick={() => fileInput?.click()}
                      className="w-full border-gray-600 text-gray-300 hover:bg-gray-800"
                    >
                      <UploadCloud className="w-4 h-4 mr-2" />
                      Choose File
                    </Button>
                  </div>
                ) : (
                  // Select from project files
                  <div className="space-y-3">
                    {/* Project Selection */}
                    <div>
                      <Label htmlFor="project" className="text-sm text-gray-400">Project</Label>
                      <select
                        id="project"
                        value={selectedProject}
                        onChange={(e) => handleProjectChange(e.target.value)}
                        className="mt-1 w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white"
                      >
                        <option value="">Select a project...</option>
                        {projects.map((project) => (
                          <option key={project.id} value={project.id}>
                            {project.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Project Files Selection */}
                    {selectedProject && (
                      <div>
                        <Label htmlFor="projectFile" className="text-sm text-gray-400">File</Label>
                        {loadingFiles ? (
                          <div className="mt-1 p-3 bg-gray-800/50 rounded-lg text-center text-gray-400">
                            Loading files...
                          </div>
                        ) : projectFiles.length === 0 ? (
                          <div className="mt-1 p-3 bg-gray-800/50 rounded-lg text-center text-gray-400">
                            No files found in this project
                          </div>
                        ) : (
                          <select
                            id="projectFile"
                            value={selectedProjectFile}
                            onChange={(e) => handleProjectFileSelect(e.target.value)}
                            className="mt-1 w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white"
                          >
                            <option value="">Select a file...</option>
                            {projectFiles.map((file) => (
                              <option key={file.id} value={file.id}>
                                {file.custom_label || file.name}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* File Info Display */}
                {fileInfo && (
                  <div className="mt-3 p-3 bg-gray-800/50 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                      <FileText className="w-4 h-4" />
                      <span className="font-medium">{fileInfo.name}</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      {formatFileSize(fileInfo.size)} • {fileInfo.type || 'Unknown type'}
                    </div>
                  </div>
                )}
              </div>





              {/* Expiration */}
              <div>
                <Label htmlFor="expiresIn" className="text-white">Link Expires In</Label>
                <select
                  id="expiresIn"
                  value={formData.expiresIn}
                  onChange={(e) => setFormData({ ...formData, expiresIn: e.target.value })}
                  className="mt-2 w-full bg-gray-800 border border-gray-600 rounded-md px-3 py-2 text-white"
                >
                  <option value="1">1 day</option>
                  <option value="7">7 days</option>
                  <option value="30">30 days</option>
                  <option value="90">90 days</option>
                </select>
              </div>

              {/* Upload Button */}
              <Button
                onClick={handleUpload}
                disabled={uploading || !fileInfo}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sharing...
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 mr-2" />
                    {fileSource === 'upload' ? 'Upload & Share' : 'Share File'}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Download Section */}
          <Card className="leonardo-card border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <Download className="w-6 h-6 mr-2 text-green-400" />
                Download Files
              </CardTitle>
              <CardDescription className="text-gray-400">
                Use a share link to download files
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center py-8">
                <Download className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">
                  Ask the sender for the file share link
                </p>
                <p className="text-sm text-gray-500">
                  The link will look like: <br />
                  <code className="bg-gray-800 px-2 py-1 rounded text-xs">
                    {window.location.origin}/file-download/[id]
                  </code>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Share Link Section */}
        {shareLink && (
          <Card className="leonardo-card border-gray-800 mt-8">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <Share2 className="w-6 h-6 mr-2 text-purple-400" />
                Share Link Generated!
              </CardTitle>
              <CardDescription className="text-gray-400">
                Copy and share this link with others
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 p-3 bg-gray-800/50 rounded-lg">
                <Input
                  value={shareLink}
                  readOnly
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <Button
                  onClick={copyToClipboard}
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2 text-green-400" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <div className="mt-3 flex items-center gap-2 text-sm text-gray-400">
                <AlertCircle className="w-4 h-4" />
                <span>This link will expire in {formData.expiresIn} day(s)</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Features */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <UploadCloud className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Easy Upload</h3>
            <p className="text-gray-400">Drag & drop or click to upload files up to 50MB</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Share2 className="w-6 h-6 text-green-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Secure Sharing</h3>
            <p className="text-gray-400">Get a unique link to share with anyone, anywhere</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Download className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Quick Download</h3>
            <p className="text-gray-400">No registration required to download shared files</p>
          </div>
        </div>
      </main>
    </div>
  )
}
