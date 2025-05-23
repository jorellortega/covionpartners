"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Download, Pencil, Trash2, Search, Filter, ArrowLeft, Grid, List, SortAsc, SortDesc } from "lucide-react"
import { useAuth } from "@/hooks/useAuth"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { toast } from "sonner"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ProjectFile {
  id: string
  project_id: string
  name: string
  storage_name: string
  url: string
  type: string
  size: number
  created_at: string
  team_only: boolean
  access_level: number
  custom_label?: string
  label_status?: string
  project?: {
    name: string
  }
}

interface Project {
  id: string
  name: string
}

type SortField = 'name' | 'date' | 'size'
type SortOrder = 'asc' | 'desc'
type ViewMode = 'grid' | 'list'

export default function ProjectFilesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const supabase = createClientComponentClient()
  
  const [files, setFiles] = useState<ProjectFile[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [accessLevel, setAccessLevel] = useState<number>(1)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([])
  const [editingFileName, setEditingFileName] = useState<string | null>(null)
  const [newFileName, setNewFileName] = useState("")
  const [editingFileId, setEditingFileId] = useState<string | null>(null)
  const [editingAccessLevel, setEditingAccessLevel] = useState<number>(1)
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [selectedFileType, setSelectedFileType] = useState<string>("all")

  useEffect(() => {
    fetchProjects()
    fetchFiles()
  }, [selectedProject])

  const fetchProjects = async () => {
    const { data: projectsData, error: projectsError } = await supabase
      .from('projects')
      .select('id, name')
      .order('name')

    if (!projectsError && projectsData) {
      setProjects(projectsData)
    }
  }

  const fetchFiles = async () => {
    setIsLoading(true)
    try {
      let query = supabase
        .from('project_files')
        .select(`
          *,
          project:projects(name)
        `)
        .order('created_at', { ascending: false })

      if (selectedProject !== "all") {
        query = query.eq('project_id', selectedProject)
      }

      const { data, error } = await query

      if (error) throw error
      if (data) setFiles(data)
    } catch (error) {
      console.error('Error fetching files:', error)
      toast.error('Failed to fetch files')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartEditFileName = (file: ProjectFile) => {
    setEditingFileName(file.id)
    setNewFileName(file.name)
  }

  const handleSaveFileName = async (file: ProjectFile) => {
    try {
      const { error } = await supabase
        .from('project_files')
        .update({ name: newFileName })
        .eq('id', file.id)

      if (error) throw error
      setEditingFileName(null)
      fetchFiles()
      toast.success('File name updated')
    } catch (error) {
      console.error('Error updating file name:', error)
      toast.error('Failed to update file name')
    }
  }

  const handleCancelEditFileName = () => {
    setEditingFileName(null)
    setNewFileName("")
  }

  const handleEditAccessLevel = (file: ProjectFile) => {
    setEditingFileId(file.id)
    setEditingAccessLevel(file.access_level)
    setEditingFileName(null)
  }

  const handleSaveAccessLevel = async (file: ProjectFile) => {
    try {
      const { error } = await supabase
        .from('project_files')
        .update({ access_level: editingAccessLevel })
        .eq('id', file.id)

      if (error) throw error
      setEditingFileId(null)
      fetchFiles()
      toast.success('Access level updated')
    } catch (error) {
      console.error('Error updating access level:', error)
      toast.error('Failed to update access level')
    }
  }

  const handleDeleteFile = async (file: ProjectFile) => {
    if (!confirm('Are you sure you want to delete this file?')) return

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('partnerfiles')
        .remove([`project-files/${file.project_id}/${file.storage_name}`])

      if (storageError) throw storageError

      // Delete from database
      const { error: dbError } = await supabase
        .from('project_files')
        .delete()
        .eq('id', file.id)

      if (dbError) throw dbError

      fetchFiles()
      toast.success('File deleted successfully')
    } catch (error) {
      console.error('Error deleting file:', error)
      toast.error('Failed to delete file')
    }
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <FileText className="w-5 h-5 text-blue-400" />
    if (fileType.startsWith('video/')) return <FileText className="w-5 h-5 text-purple-400" />
    if (fileType.startsWith('audio/')) return <FileText className="w-5 h-5 text-green-400" />
    if (fileType.includes('pdf')) return <FileText className="w-5 h-5 text-red-400" />
    return <FileText className="w-5 h-5 text-gray-400" />
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileType = (fileType: string) => {
    if (fileType.startsWith('image/')) return 'image'
    if (fileType.startsWith('video/')) return 'video'
    if (fileType.startsWith('audio/')) return 'audio'
    if (fileType.includes('pdf')) return 'document'
    if (fileType.includes('doc') || fileType.includes('docx')) return 'document'
    if (fileType.includes('xls') || fileType.includes('xlsx')) return 'spreadsheet'
    if (fileType.includes('ppt') || fileType.includes('pptx')) return 'presentation'
    return 'other'
  }

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesAccess = file.access_level <= accessLevel
    const matchesType = selectedFileType === 'all' || getFileType(file.type) === selectedFileType
    return matchesSearch && matchesAccess && matchesType
  })

  const sortedFiles = [...filteredFiles].sort((a, b) => {
    const multiplier = sortOrder === 'asc' ? 1 : -1
    switch (sortField) {
      case 'name':
        return multiplier * a.name.localeCompare(b.name)
      case 'date':
        return multiplier * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      case 'size':
        return multiplier * (a.size - b.size)
      default:
        return 0
    }
  })

  const groupedFiles = sortedFiles.reduce((acc, file) => {
    const projectName = file.project?.name || 'Unknown Project'
    if (!acc[projectName]) {
      acc[projectName] = []
    }
    acc[projectName].push(file)
    return acc
  }, {} as Record<string, ProjectFile[]>)

  const renderFileCard = (file: ProjectFile) => (
    <div
      key={file.id}
      className="flex flex-col p-3 bg-gray-800/50 rounded-lg group hover:bg-gray-800/70 transition-colors"
    >
      <div className="flex items-center gap-2 mb-2">
        {getFileIcon(file.type)}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{file.name}</p>
          <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
        </div>
      </div>
      <div className="flex items-center justify-between mt-auto">
        <span className="text-xs text-gray-400">
          {new Date(file.created_at).toLocaleDateString()}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-blue-400"
            onClick={() => window.open(file.url, '_blank')}
            title="Download File"
          >
            <Download className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-blue-400"
            onClick={() => {
              handleEditAccessLevel(file)
              handleStartEditFileName(file)
            }}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-400 hover:text-red-300"
            onClick={() => handleDeleteFile(file)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )

  const renderFileList = (file: ProjectFile) => (
    <div
      key={file.id}
      className="flex flex-col md:flex-row items-start md:items-center p-3 bg-gray-800/50 rounded-lg group hover:bg-gray-800/70 transition-colors w-full"
    >
      {/* Left: File info */}
      <div className="flex items-center min-w-0 flex-1 gap-2 w-full">
        <input
          type="checkbox"
          checked={selectedFileIds.includes(file.id)}
          onChange={() => setSelectedFileIds(prev =>
            prev.includes(file.id)
              ? prev.filter(id => id !== file.id)
              : [...prev, file.id]
          )}
          className="accent-purple-500 w-4 h-4"
          aria-label={`Select file ${file.name}`}
        />
        {getFileIcon(file.type)}
        <div className="min-w-0 flex flex-col w-full">
          {editingFileName === file.id ? (
            <div className="flex items-center gap-2 w-full">
              <Input
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                className="h-8 text-sm w-full"
                autoFocus
              />
              <Button
                size="sm"
                onClick={() => handleSaveFileName(file)}
                className="h-8"
              >
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancelEditFileName}
                className="h-8"
              >
                Cancel
              </Button>
            </div>
          ) : (
            <p
              className="text-lg font-bold text-white truncate cursor-pointer hover:text-blue-400 w-full"
              onClick={() => handleStartEditFileName(file)}
            >
              {file.name}
            </p>
          )}
          <p className="text-xs text-gray-400 flex items-center gap-2 w-full">
            <span className="hidden md:inline opacity-50">
              {new Date(file.created_at).toLocaleDateString()}
            </span>
            • <span className="hidden md:inline opacity-25">Access Level:</span>
            {editingFileId === file.id ? (
              <span className="flex items-center gap-1 ml-1">
                <Select
                  value={String(editingAccessLevel)}
                  onValueChange={v => setEditingAccessLevel(Number(v))}
                >
                  <SelectTrigger className="w-[70px] h-6 text-xs">
                    <SelectValue placeholder="Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                    <SelectItem value="4">4</SelectItem>
                    <SelectItem value="5">5</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  className="ml-1 px-2 py-1 text-xs"
                  onClick={() => handleSaveAccessLevel(file)}
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="ml-1 px-2 py-1 text-xs"
                  onClick={() => setEditingFileId(null)}
                >
                  Cancel
                </Button>
              </span>
            ) : (
              <span className="ml-1 opacity-25 hidden md:inline">
                {file.access_level}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 mt-2 md:mt-0 w-full md:w-auto justify-end">
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-blue-400"
          onClick={() => window.open(file.url, '_blank')}
          title="Download File"
        >
          <Download className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-blue-400"
          onClick={() => {
            handleEditAccessLevel(file)
            handleStartEditFileName(file)
          }}
        >
          <Pencil className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-red-400 hover:text-red-300"
          onClick={() => handleDeleteFile(file)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="text-gray-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Project Files</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters */}
        <Card className="leonardo-card border-gray-800">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Project</label>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">File Type</label>
              <Select value={selectedFileType} onValueChange={setSelectedFileType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select file type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="image">Images</SelectItem>
                  <SelectItem value="video">Videos</SelectItem>
                  <SelectItem value="audio">Audio</SelectItem>
                  <SelectItem value="document">Documents</SelectItem>
                  <SelectItem value="spreadsheet">Spreadsheets</SelectItem>
                  <SelectItem value="presentation">Presentations</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Access Level</label>
              <Select value={String(accessLevel)} onValueChange={v => setAccessLevel(Number(v))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select access level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Level 1</SelectItem>
                  <SelectItem value="2">Level 2</SelectItem>
                  <SelectItem value="3">Level 3</SelectItem>
                  <SelectItem value="4">Level 4</SelectItem>
                  <SelectItem value="5">Level 5</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Sort By</label>
              <div className="flex gap-2">
                <Select value={sortField} onValueChange={v => setSortField(v as SortField)}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="size">Size</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                >
                  {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Files List */}
        <div className="lg:col-span-3">
          <Card className="leonardo-card border-gray-800">
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle>Files</CardTitle>
                  <CardDescription className="text-gray-400">
                    {filteredFiles.length} files found
                  </CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Input
                      placeholder="Search files..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9"
                    />
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  </div>
                  <div className="flex items-center gap-1 bg-gray-800/50 rounded-lg p-1">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="h-8 w-8 p-0"
                    >
                      <Grid className="w-4 h-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="h-8 w-8 p-0"
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center py-8">
                  <LoadingSpinner className="w-8 h-8" />
                </div>
              ) : filteredFiles.length > 0 ? (
                <div className="space-y-6">
                  {Object.entries(groupedFiles).map(([projectName, projectFiles]) => (
                    <div key={projectName} className="space-y-2">
                      <h3 className="text-lg font-semibold text-gray-300">{projectName}</h3>
                      {viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {projectFiles.map(renderFileCard)}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {projectFiles.map(renderFileList)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  No files found
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 