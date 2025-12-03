"use client";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download, Pencil, Trash2, Plus, List, Grid, AlignJustify, Search } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { toast } from "sonner";
import { Document, Page, pdfjs } from 'react-pdf';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import bcrypt from 'bcryptjs';
import React from 'react';
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface ProjectFile {
  id: string;
  project_id: string;
  name: string;
  storage_name: string;
  url: string;
  type: string;
  size: number;
  created_at: string;
  team_only: boolean;
  access_level: number;
  custom_label?: string;
  label_status?: string;
  folder_id?: string | null;
}

export default function ProjectFilesPage() {
  const params = useParams();
  const projectId = params.id as string;
  const supabase = createClientComponentClient();

  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [editingFileName, setEditingFileName] = useState<string | null>(null);
  const [newFileName, setNewFileName] = useState("");
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [editingAccessLevel, setEditingAccessLevel] = useState<number>(1);
  const [editingLabel, setEditingLabel] = useState<string | null>(null);
  const [newLabel, setNewLabel] = useState("");
  const [newLabelStatus, setNewLabelStatus] = useState("draft");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadFileName, setUploadFileName] = useState("");
  const [uploadAccessLevel, setUploadAccessLevel] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'compact'>('grid');
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<'files' | 'desktop'>('files');

  const [desktopCurrentFolder, setDesktopCurrentFolder] = useState<string | null>(null);
  const [desktopFolders, setDesktopFolders] = useState<any[]>([]);
  const [desktopFiles, setDesktopFiles] = useState<ProjectFile[]>([]);
  const [desktopLoading, setDesktopLoading] = useState(false);
  const [desktopPasswordPrompt, setDesktopPasswordPrompt] = useState<{folder: any, open: boolean}>({folder: null, open: false});
  const [desktopPasswordInput, setDesktopPasswordInput] = useState('');
  const [desktopPasswordError, setDesktopPasswordError] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderPassword, setNewFolderPassword] = useState('');
  const [newFolderHint, setNewFolderHint] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [draggedFileId, setDraggedFileId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{x: number, y: number, file: any} | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  useEffect(() => {
    const fetchFiles = async () => {
      setLoading(true);
      // Fetch from project_files
      const { data: pfData, error: pfError } = await supabase
        .from('project_files')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      // Fetch from timeline_files
      const { data: tfData, error: tfError } = await supabase
        .from('timeline_files')
        .select('*')
        .eq('project_id', projectId)
        .order('uploaded_at', { ascending: false });
      // Map both to ProjectFile interface
      const pfMapped = (pfData || []).map(f => ({
        id: f.id,
        project_id: f.project_id,
        name: f.name,
        storage_name: f.storage_name,
        url: f.url,
        type: f.type,
        size: f.size || 0,
        created_at: f.created_at,
        team_only: f.team_only,
        access_level: f.access_level,
        custom_label: f.custom_label,
        label_status: f.label_status,
      }));
      const tfMapped = (tfData || []).map(f => ({
        id: f.id,
        project_id: f.project_id,
        name: f.file_name,
        storage_name: f.file_url,
        url: supabase.storage.from('partnerfiles').getPublicUrl(f.file_url).data.publicUrl,
        type: f.file_name.split('.').pop() || '',
        size: f.size || 0,
        created_at: f.uploaded_at,
        team_only: false,
        access_level: 1,
        custom_label: undefined,
        label_status: undefined,
      }));
      // Merge and sort by date descending
      const allFiles = [...pfMapped, ...tfMapped].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setFiles(allFiles);
      setLoading(false);
    };
    if (projectId) fetchFiles();
  }, [projectId, isUploading]);

  // Fetch folders and files for the project
  useEffect(() => {
    const fetchDesktopData = async () => {
      setDesktopLoading(true);
      const { data: folders } = await supabase.from('folders').select('*').eq('project_id', projectId);
      // Fetch files from both tables
      const { data: pfData } = await supabase.from('project_files').select('*').eq('project_id', projectId);
      const { data: tfData } = await supabase.from('timeline_files').select('*').eq('project_id', projectId);
      // Map files to ProjectFile interface
      const pfMapped = (pfData || []).map(f => ({ ...f }));
      const tfMapped = (tfData || []).map(f => ({
        id: f.id,
        project_id: f.project_id,
        name: f.file_name,
        storage_name: f.file_url,
        url: supabase.storage.from('partnerfiles').getPublicUrl(f.file_url).data.publicUrl,
        type: f.file_name.split('.').pop() || '',
        size: f.size || 0,
        created_at: f.uploaded_at,
        team_only: false,
        access_level: 1,
        custom_label: undefined,
        label_status: undefined,
        folder_id: f.folder_id || null,
      }));
      setDesktopFolders(folders || []);
      setDesktopFiles([...pfMapped, ...tfMapped]);
      setDesktopLoading(false);
    };
    fetchDesktopData();
  }, [projectId]);

  const handleSelectFile = (fileId: string) => {
    setSelectedFileIds((prev) =>
      prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId]
    );
  };

  const handleSelectAll = () => {
    if (selectedFileIds.length === files.length) {
      setSelectedFileIds([]);
    } else {
      setSelectedFileIds(files.map((file) => file.id));
    }
  };

  const handleStartEditFileName = (file: ProjectFile) => {
    setEditingFileName(file.id);
    setNewFileName(file.name);
  };

  const handleSaveFileName = async (file: ProjectFile) => {
    try {
      const { error } = await supabase
        .from("project_files")
        .update({ name: newFileName })
        .eq("id", file.id);
      if (error) throw error;
      setEditingFileName(null);
      setNewFileName("");
      toast.success("File name updated");
      setLoading(true);
      setTimeout(() => setLoading(false), 500); // trigger reload
    } catch (error) {
      toast.error("Failed to update file name");
    }
  };

  const handleCancelEditFileName = () => {
    setEditingFileName(null);
    setNewFileName("");
  };

  const handleEditAccessLevel = (file: ProjectFile) => {
    setEditingFileId(file.id);
    setEditingAccessLevel(file.access_level);
    setEditingFileName(null);
  };

  const handleSaveAccessLevel = async (file: ProjectFile) => {
    try {
      const { error } = await supabase
        .from("project_files")
        .update({ access_level: editingAccessLevel })
        .eq("id", file.id);
      if (error) throw error;
      setEditingFileId(null);
      toast.success("Access level updated");
      setLoading(true);
      setTimeout(() => setLoading(false), 500);
    } catch (error) {
      toast.error("Failed to update access level");
    }
  };

  const handleDeleteFile = async (file: ProjectFile) => {
    if (!confirm("Are you sure you want to delete this file?")) return;
    try {
      await supabase.storage.from("partnerfiles").remove([`project-files/${projectId}/${file.storage_name}`]);
      await supabase.from("project_files").delete().eq("id", file.id);
      toast.success("File deleted");
      setLoading(true);
      setTimeout(() => setLoading(false), 500);
    } catch (error) {
      toast.error("Failed to delete file");
    }
  };

  const handleSaveLabel = async (file: ProjectFile) => {
    try {
      const { error } = await supabase
        .from("project_files")
        .update({ custom_label: newLabel, label_status: newLabelStatus })
        .eq("id", file.id);
      if (error) throw error;
      setEditingLabel(null);
      setNewLabel("");
      setNewLabelStatus("draft");
      toast.success("Label updated");
      setLoading(true);
      setTimeout(() => setLoading(false), 500);
    } catch (error) {
      toast.error("Failed to update label");
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) return <FileText className="w-5 h-5 text-blue-400" />;
    if (fileType.startsWith("video/")) return <FileText className="w-5 h-5 text-purple-400" />;
    if (fileType.startsWith("audio/")) return <FileText className="w-5 h-5 text-green-400" />;
    if (fileType.includes("pdf")) return <FileText className="w-5 h-5 text-red-400" />;
    return <FileText className="w-5 h-5 text-gray-400" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files.length) return;
    setIsUploading(true);
    const file = e.target.files[0];
    setUploadFile(file);
    setUploadFileName(file.name.split(".").slice(0, -1).join("."));
    // Show dialog or just upload directly
    try {
      const fileExt = file.name.split('.').pop();
      const storageFileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `project-files/${projectId}/${storageFileName}`;
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage.from('partnerfiles').upload(filePath, file);
      if (uploadError) throw uploadError;
      // Get public URL
      const { data: urlData } = supabase.storage.from('partnerfiles').getPublicUrl(filePath);
      // Insert into project_files table
      const { error: insertError } = await supabase.from('project_files').insert({
        project_id: projectId,
        name: file.name,
        storage_name: storageFileName,
        url: urlData.publicUrl,
        type: file.type,
        size: file.size,
        team_only: true,
        access_level: uploadAccessLevel,
      });
      if (insertError) throw insertError;
      toast.success('File uploaded!');
      setIsUploading(false);
      setLoading(true);
      setTimeout(() => setLoading(false), 500);
    } catch (error) {
      toast.error('Failed to upload file');
      setIsUploading(false);
    }
  };

  const filteredFiles = files.filter(file => file.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const isImageFile = (fileName: string) => /\.(png|jpe?g)$/i.test(fileName);

  // Add mock desktop files/folders for the Desktop View tab
  const mockDesktopItems = [
    { id: 'folder-1', type: 'folder', name: 'Designs' },
    { id: 'folder-2', type: 'folder', name: 'Docs' },
    { id: 'file-1', type: 'image', name: 'logo.png', url: 'https://placehold.co/80x80/png' },
    { id: 'file-2', type: 'pdf', name: 'Specs.pdf', url: '' },
    { id: 'file-3', type: 'doc', name: 'Proposal.docx', url: '' },
    { id: 'file-4', type: 'image', name: 'screenshot.jpg', url: 'https://placehold.co/80x80/jpg' },
  ];

  // Get folders/files for current folder
  const currentFolders = desktopFolders.filter(f => (desktopCurrentFolder ? f.parent_folder_id === desktopCurrentFolder : !f.parent_folder_id));
  const currentFiles = desktopFiles.filter(f => (desktopCurrentFolder ? f.folder_id === desktopCurrentFolder : !f.folder_id));
  const currentFolderObj = desktopFolders.find(f => f.id === desktopCurrentFolder);

  // Password prompt logic
  const handleOpenFolder = (folder: any) => {
    if (folder.password_hash) {
      setDesktopPasswordPrompt({folder, open: true});
      setDesktopPasswordInput('');
      setDesktopPasswordError('');
    } else {
      setDesktopCurrentFolder(folder.id);
    }
  };
  const handlePasswordSubmit = async () => {
    if (!desktopPasswordPrompt.folder) return;
    const match = await bcrypt.compare(desktopPasswordInput, desktopPasswordPrompt.folder.password_hash || '');
    if (match) {
      setDesktopCurrentFolder(desktopPasswordPrompt.folder.id);
      setDesktopPasswordPrompt({folder: null, open: false});
      setDesktopPasswordInput('');
      setDesktopPasswordError('');
    } else {
      setDesktopPasswordError('Incorrect password.');
    }
  };
  const handleDesktopBack = () => {
    if (!desktopCurrentFolder) return;
    const parent = desktopFolders.find(f => f.id === desktopCurrentFolder)?.parent_folder_id;
    setDesktopCurrentFolder(parent || null);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    setCreatingFolder(true);
    let password_hash = null;
    if (newFolderPassword) {
      password_hash = await bcrypt.hash(newFolderPassword, 10);
    }
    await supabase.from('folders').insert({
      project_id: projectId,
      name: newFolderName.trim(),
      parent_folder_id: desktopCurrentFolder,
      password_hash,
      password_hint: newFolderHint.trim() || null,
    });
    setShowNewFolder(false);
    setNewFolderName('');
    setNewFolderPassword('');
    setNewFolderHint('');
    setCreatingFolder(false);
    // Refetch folders
    const { data: folders } = await supabase.from('folders').select('*').eq('project_id', projectId);
    setDesktopFolders(folders || []);
  };

  const handleFileDragStart = (fileId: string) => {
    setDraggedFileId(fileId);
  };
  const handleFolderDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  const handleFolderDrop = async (folderId: string | null) => {
    if (!draggedFileId) return;
    // Find file in desktopFiles
    const file = desktopFiles.find(f => f.id === draggedFileId);
    if (!file) return;
    // Determine which table to update
    const table = file.storage_name ? 'project_files' : 'timeline_files';
    await supabase.from(table).update({ folder_id: folderId }).eq('id', file.id);
    setDraggedFileId(null);
    // Refetch files
    const { data: pfData } = await supabase.from('project_files').select('*').eq('project_id', projectId);
    const { data: tfData } = await supabase.from('timeline_files').select('*').eq('project_id', projectId);
    const pfMapped = (pfData || []).map(f => ({ ...f }));
    const tfMapped = (tfData || []).map(f => ({
      id: f.id,
      project_id: f.project_id,
      name: f.file_name,
      storage_name: f.file_url,
      url: supabase.storage.from('partnerfiles').getPublicUrl(f.file_url).data.publicUrl,
      type: f.file_name.split('.').pop() || '',
      size: f.size || 0,
      created_at: f.uploaded_at,
      team_only: false,
      access_level: 1,
      custom_label: undefined,
      label_status: undefined,
      folder_id: f.folder_id || null,
    }));
    setDesktopFiles([...pfMapped, ...tfMapped]);
  };

  const handleFileContextMenu = (e: React.MouseEvent, file: any) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, file });
  };
  const handleMoveToRoot = async (file: any) => {
    const table = file.storage_name ? 'project_files' : 'timeline_files';
    await supabase.from(table).update({ folder_id: null }).eq('id', file.id);
    setContextMenu(null);
    // Refetch files
    const { data: pfData } = await supabase.from('project_files').select('*').eq('project_id', projectId);
    const { data: tfData } = await supabase.from('timeline_files').select('*').eq('project_id', projectId);
    const pfMapped = (pfData || []).map(f => ({ ...f }));
    const tfMapped = (tfData || []).map(f => ({
      id: f.id,
      project_id: f.project_id,
      name: f.file_name,
      storage_name: f.file_url,
      url: supabase.storage.from('partnerfiles').getPublicUrl(f.file_url).data.publicUrl,
      type: f.file_name.split('.').pop() || '',
      size: f.size || 0,
      created_at: f.uploaded_at,
      team_only: false,
      access_level: 1,
      custom_label: undefined,
      label_status: undefined,
      folder_id: f.folder_id || null,
    }));
    setDesktopFiles([...pfMapped, ...tfMapped]);
  };
  const handleCloseContextMenu = () => setContextMenu(null);

  const handleStartRename = (item: any) => {
    setRenamingId(item.id);
    setRenameValue(item.name);
  };
  const handleRenameSubmit = async (item: any, isFolder: boolean) => {
    if (!renameValue.trim() || renameValue === item.name) {
      setRenamingId(null);
      return;
    }
    const table = isFolder ? 'folders' : (item.storage_name ? 'project_files' : 'timeline_files');
    await supabase.from(table).update({ name: renameValue.trim() }).eq('id', item.id);
    setRenamingId(null);
    // Refetch folders/files
    if (isFolder) {
      const { data: folders } = await supabase.from('folders').select('*').eq('project_id', projectId);
      setDesktopFolders(folders || []);
    } else {
      const { data: pfData } = await supabase.from('project_files').select('*').eq('project_id', projectId);
      const { data: tfData } = await supabase.from('timeline_files').select('*').eq('project_id', projectId);
      const pfMapped = (pfData || []).map(f => ({ ...f }));
      const tfMapped = (tfData || []).map(f => ({
        id: f.id,
        project_id: f.project_id,
        name: f.file_name,
        storage_name: f.file_url,
        url: supabase.storage.from('partnerfiles').getPublicUrl(f.file_url).data.publicUrl,
        type: f.file_name.split('.').pop() || '',
        size: f.size || 0,
        created_at: f.uploaded_at,
        team_only: false,
        access_level: 1,
        custom_label: undefined,
        label_status: undefined,
        folder_id: f.folder_id || null,
      }));
      setDesktopFiles([...pfMapped, ...tfMapped]);
    }
  };

  // Helper to build breadcrumb path
  function getBreadcrumbPath(folders: any[], currentId: string | null) {
    const path: any[] = [];
    let curr = folders.find(f => f.id === currentId);
    while (curr) {
      path.unshift(curr);
      curr = folders.find(f => f.id === curr.parent_folder_id);
    }
    return path;
  }

  const breadcrumbPath = getBreadcrumbPath(desktopFolders, desktopCurrentFolder);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <Card className="leonardo-card border-gray-800 mt-6">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Project Files</CardTitle>
              <CardDescription className="text-gray-400">
                Files only visible to the project team, based on your access level
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1 bg-gray-800/50 rounded-lg p-1 mb-2">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="h-8 w-8 p-0"
                  aria-label="List view"
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="h-8 w-8 p-0"
                  aria-label="Grid view"
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'compact' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('compact')}
                  className="h-8 w-8 p-0"
                  aria-label="Compact view"
                >
                  <AlignJustify className="w-4 h-4" />
                </Button>
              </div>
              <Select value={String(uploadAccessLevel)} onValueChange={v => setUploadAccessLevel(Number(v))}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Access Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Level 1</SelectItem>
                  <SelectItem value="2">Level 2</SelectItem>
                  <SelectItem value="3">Level 3</SelectItem>
                  <SelectItem value="4">Level 4</SelectItem>
                  <SelectItem value="5">Level 5</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={() => document.getElementById('file-upload-input')?.click()}
                className="gradient-button w-full sm:w-auto"
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <LoadingSpinner className="w-4 h-4 mr-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    Add File
                  </>
                )}
              </Button>
              <input
                type="file"
                id="file-upload-input"
                className="hidden"
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                multiple={false}
                onChange={handleFileUpload}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={v => setActiveTab(v as 'files' | 'desktop')} className="mb-4">
            <TabsList>
              <TabsTrigger value="files">Files</TabsTrigger>
              <TabsTrigger value="desktop">Desktop View</TabsTrigger>
            </TabsList>
            <TabsContent value="files">
              {/* Search Bar */}
              <div className="relative mb-4">
                <Input
                  placeholder="Search files..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9"
                />
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
              {loading ? (
                <div className="flex justify-center items-center py-8">
                  <LoadingSpinner className="w-8 h-8" />
                </div>
              ) : filteredFiles.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  No files found for this project.
                </div>
              ) : (
                <div className="space-y-2">
                  {/* View Mode Rendering */}
                  {viewMode === 'list' && (
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          type="checkbox"
                          checked={selectedFileIds.length === files.length && files.length > 0}
                          onChange={handleSelectAll}
                          className="accent-purple-500 w-4 h-4"
                          aria-label="Select all files"
                        />
                        <span className="text-xs text-gray-400">Select All</span>
                      </div>
                      {filteredFiles.map((file, index) => (
                        <div key={file.id} className="flex flex-col md:flex-row items-start md:items-center p-3 bg-gray-800/50 rounded-lg group hover:bg-gray-800/70 transition-colors w-full">
                          {/* Left: File info */}
                          <div className="flex items-center min-w-0 flex-1 gap-2 w-full">
                            <input
                              type="checkbox"
                              checked={selectedFileIds.includes(file.id)}
                              onChange={() => handleSelectFile(file.id)}
                              className="accent-purple-500 w-4 h-4"
                              aria-label={`Select file ${file.name}`}
                            />
                            <span className="text-xs text-gray-400 w-5 text-right">{index + 1}</span>
                            {isImageFile(file.name) ? (
                              <img src={file.url} alt={file.name} className="w-14 h-14 object-cover rounded border border-gray-700" />
                            ) : (
                              getFileIcon(file.type)
                            )}
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
                                <span className="hidden md:inline opacity-50">{new Date(file.created_at).toLocaleDateString()}</span> • <span className="hidden md:inline opacity-25">Access Level:</span>
                                {editingFileId === file.id ? (
                                  <span className="flex items-center gap-1 ml-1">
                                    <Select value={String(editingAccessLevel)} onValueChange={v => setEditingAccessLevel(Number(v))}>
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
                                    <Button size="sm" className="ml-1 px-2 py-1 text-xs" onClick={() => handleSaveAccessLevel(file)}>Save</Button>
                                    <Button size="sm" variant="outline" className="ml-1 px-2 py-1 text-xs" onClick={() => setEditingFileId(null)}>Cancel</Button>
                                  </span>
                                ) : (
                                  <span className="ml-1 opacity-25 hidden md:inline">{file.access_level}</span>
                                )}
                              </p>
                            </div>
                          </div>
                          {/* Middle: Label badge */}
                          <div className="flex-1 flex justify-center mt-2 md:mt-0 w-full">
                            {editingLabel === file.id ? (
                              <div className="flex items-center gap-2 w-full">
                                <Select value={newLabelStatus} onValueChange={setNewLabelStatus}>
                                  <SelectTrigger className="w-[120px] h-6 text-xs">
                                    <SelectValue placeholder="Status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="in_review">In Review</SelectItem>
                                    <SelectItem value="archived">Archived</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Input
                                  value={newLabel}
                                  onChange={(e) => setNewLabel(e.target.value)}
                                  placeholder="Custom label (optional)"
                                  className="h-6 text-xs w-[150px]"
                                />
                                <Button
                                  size="sm"
                                  onClick={() => handleSaveLabel(file)}
                                  className="h-6 text-xs"
                                >
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingLabel(null);
                                    setNewLabel("");
                                    setNewLabelStatus("draft");
                                  }}
                                  className="h-6 text-xs"
                                >
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-gray-400" />
                                <span className="text-xs text-gray-400">{file.custom_label || file.label_status || "draft"}</span>
                              </div>
                            )}
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
                              onClick={() => handleStartEditFileName(file)}
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
                      ))}
                    </>
                  )}
                  {viewMode === 'grid' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {filteredFiles.map((file, index) => (
                        <div key={file.id} className="flex flex-col items-center p-4 bg-gray-800/50 rounded-lg group hover:bg-gray-800/70 transition-colors">
                          {isImageFile(file.name) ? (
                            <img src={file.url} alt={file.name} className="w-24 h-24 object-cover rounded border border-gray-700 mb-2" />
                          ) : (
                            <div className="w-24 h-24 flex items-center justify-center bg-gray-700/40 rounded border border-gray-700 mb-2">
                              {getFileIcon(file.type)}
                            </div>
                          )}
                          <div className="w-full text-center">
                            <div className="text-base font-semibold text-white truncate">{file.name}</div>
                            <div className="text-xs text-gray-400 mb-2">{formatFileSize(file.size)}</div>
                            {editingFileId === file.id ? (
                              <div className="flex items-center gap-1 mb-2">
                                <Select value={String(editingAccessLevel)} onValueChange={v => setEditingAccessLevel(Number(v))}>
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
                                <Button size="sm" className="ml-1 px-2 py-1 text-xs" onClick={() => handleSaveAccessLevel(file)}>Save</Button>
                                <Button size="sm" variant="outline" className="ml-1 px-2 py-1 text-xs" onClick={() => setEditingFileId(null)}>Cancel</Button>
                              </div>
                            ) : (
                              <div className="text-xs text-gray-400 mb-2">Access Level: <span className="opacity-50">{file.access_level}</span></div>
                            )}
                            {editingLabel === file.id ? (
                              <div className="flex flex-col items-center gap-2 w-full mb-2">
                                <Select value={newLabelStatus} onValueChange={setNewLabelStatus}>
                                  <SelectTrigger className="w-[120px] h-6 text-xs">
                                    <SelectValue placeholder="Status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="in_review">In Review</SelectItem>
                                    <SelectItem value="archived">Archived</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Input
                                  value={newLabel}
                                  onChange={(e) => setNewLabel(e.target.value)}
                                  placeholder="Custom label (optional)"
                                  className="h-6 text-xs w-full"
                                />
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => handleSaveLabel(file)} className="h-6 text-xs">Save</Button>
                                  <Button size="sm" variant="outline" onClick={() => { setEditingLabel(null); setNewLabel(""); setNewLabelStatus("draft"); }} className="h-6 text-xs">Cancel</Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 mb-2">
                                <FileText className="w-4 h-4 text-gray-400" />
                                <span className="text-xs text-gray-400">{file.custom_label || file.label_status || "draft"}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-blue-400" onClick={() => window.open(file.url, '_blank')} title="Download File"><Download className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-blue-400" onClick={() => handleStartEditFileName(file)}><Pencil className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300" onClick={() => handleDeleteFile(file)}><Trash2 className="w-4 h-4" /></Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {viewMode === 'compact' && (
                    <div className="divide-y divide-gray-800 border border-gray-800 rounded-lg overflow-hidden">
                      {filteredFiles.map((file, index) => (
                        <div key={file.id} className="flex items-center px-3 py-2 bg-gray-900 hover:bg-gray-800 transition-colors">
                          {isImageFile(file.name) ? (
                            <img src={file.url} alt={file.name} className="w-10 h-10 object-cover rounded border border-gray-700 mr-2" />
                          ) : (
                            <span className="mr-2">{getFileIcon(file.type)}</span>
                          )}
                          {editingFileName === file.id ? (
                            <Input
                              value={newFileName}
                              onChange={(e) => setNewFileName(e.target.value)}
                              className="h-8 text-sm flex-1"
                              autoFocus
                              onBlur={handleCancelEditFileName}
                              onKeyDown={e => { if (e.key === 'Enter') handleSaveFileName(file); }}
                            />
                          ) : (
                            <span className="flex-1 truncate text-white text-sm cursor-pointer hover:text-blue-400" onClick={() => handleStartEditFileName(file)}>{file.name}</span>
                          )}
                          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-blue-400" onClick={() => window.open(file.url, '_blank')} title="Download File"><Download className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-blue-400" onClick={() => handleStartEditFileName(file)}><Pencil className="w-4 h-4" /></Button>
                          <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300" onClick={() => handleDeleteFile(file)}><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
            <TabsContent value="desktop">
              {/* Covion Operating System Title */}
              <div className="w-full flex justify-center mb-6">
                <h2 className="text-2xl font-bold text-white tracking-wide drop-shadow-lg">Covion Operating System</h2>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <Button size="sm" variant="outline" onClick={() => setShowNewFolder(true)}>+ New Folder</Button>
                {desktopCurrentFolder && (
                  <Button size="sm" variant="ghost" onClick={handleDesktopBack}>&larr; Back</Button>
                )}
                <span className="text-gray-400">{currentFolderObj ? currentFolderObj.name : 'Root'}</span>
              </div>
              {showNewFolder && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                  <div className="bg-gray-900 rounded-lg p-6 shadow-xl w-full max-w-xs">
                    <div className="text-lg font-semibold mb-2 text-white">Create New Folder</div>
                    <input
                      type="text"
                      className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700 text-white mb-2"
                      placeholder="Folder name"
                      value={newFolderName}
                      onChange={e => setNewFolderName(e.target.value)}
                      autoFocus
                    />
                    <input
                      type="password"
                      className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700 text-white mb-2"
                      placeholder="Password (optional)"
                      value={newFolderPassword}
                      onChange={e => setNewFolderPassword(e.target.value)}
                    />
                    <input
                      type="text"
                      className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700 text-white mb-2"
                      placeholder="Password hint (optional)"
                      value={newFolderHint}
                      onChange={e => setNewFolderHint(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleCreateFolder} disabled={creatingFolder}>{creatingFolder ? 'Creating...' : 'Create'}</Button>
                      <Button size="sm" variant="outline" onClick={() => setShowNewFolder(false)} disabled={creatingFolder}>Cancel</Button>
                    </div>
                  </div>
                </div>
              )}
              {desktopPasswordPrompt.open && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                  <div className="bg-gray-900 rounded-lg p-6 shadow-xl w-full max-w-xs">
                    <div className="text-lg font-semibold mb-2 text-white">Password Required</div>
                    {desktopPasswordPrompt.folder.password_hint && (
                      <div className="text-xs text-gray-400 mb-2">Hint: {desktopPasswordPrompt.folder.password_hint}</div>
                    )}
                    <input
                      type="password"
                      className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700 text-white mb-2"
                      placeholder="Enter password"
                      value={desktopPasswordInput}
                      onChange={e => setDesktopPasswordInput(e.target.value)}
                    />
                    {desktopPasswordError && <div className="text-red-400 text-xs mb-2">{desktopPasswordError}</div>}
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handlePasswordSubmit}>Unlock</Button>
                      <Button size="sm" variant="outline" onClick={() => setDesktopPasswordPrompt({folder: null, open: false})}>Cancel</Button>
                    </div>
                  </div>
                </div>
              )}
              <div className="w-full max-w-2xl mx-auto grid grid-cols-4 gap-8 mt-4">
                {currentFolders.map(folder => (
                  <div
                    key={folder.id}
                    className="flex flex-col items-center group cursor-pointer"
                    onClick={() => handleOpenFolder(folder)}
                    onDragOver={handleFolderDragOver}
                    onDrop={() => handleFolderDrop(folder.id)}
                    style={{ border: draggedFileId ? '2px dashed #facc15' : undefined }}
                  >
                    <div className="w-16 h-16 flex items-center justify-center bg-yellow-200/80 rounded-lg border-2 border-yellow-400 mb-2 relative">
                      <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h3.28a2 2 0 011.42.59l1.42 1.42A2 2 0 0012.72 8H19a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" /></svg>
                      {folder.password_hash && <span className="absolute top-1 right-1 text-yellow-700" title="Password protected">🔒</span>}
                    </div>
                    {renamingId === folder.id ? (
                      <input
                        className="text-xs text-gray-200 font-medium truncate w-20 text-center group-hover:text-blue-400 bg-gray-800 border border-gray-700 rounded px-1 py-0.5"
                        value={renameValue}
                        autoFocus
                        onChange={e => setRenameValue(e.target.value)}
                        onBlur={() => handleRenameSubmit(folder, true)}
                        onKeyDown={e => { if (e.key === 'Enter') handleRenameSubmit(folder, true); if (e.key === 'Escape') setRenamingId(null); }}
                      />
                    ) : (
                      <div
                        className="text-xs text-gray-200 font-medium truncate w-20 text-center group-hover:text-blue-400"
                        onClick={e => { e.stopPropagation(); handleStartRename(folder); }}
                      >
                        {folder.name}
                      </div>
                    )}
                  </div>
                ))}
                {currentFiles.map(item => (
                  <div
                    key={item.id}
                    className="flex flex-col items-center group cursor-pointer"
                    draggable
                    onDragStart={() => handleFileDragStart(item.id)}
                    onDragEnd={() => setDraggedFileId(null)}
                    onContextMenu={e => handleFileContextMenu(e, item)}
                  >
                    {isImageFile(item.name) ? (
                      <img src={item.url} alt={item.name} className="w-16 h-16 object-cover rounded-lg border-2 border-blue-400 mb-2" />
                    ) : (
                      <div className="w-16 h-16 flex items-center justify-center bg-gray-700/40 rounded border border-gray-700 mb-2">
                        <span className="font-bold text-xs text-gray-500">FILE</span>
                      </div>
                    )}
                    {renamingId === item.id ? (
                      <input
                        className="text-xs text-gray-200 font-medium truncate w-20 text-center group-hover:text-blue-400 bg-gray-800 border border-gray-700 rounded px-1 py-0.5"
                        value={renameValue}
                        autoFocus
                        onChange={e => setRenameValue(e.target.value)}
                        onBlur={() => handleRenameSubmit(item, false)}
                        onKeyDown={e => { if (e.key === 'Enter') handleRenameSubmit(item, false); if (e.key === 'Escape') setRenamingId(null); }}
                      />
                    ) : (
                      <div
                        className="text-xs text-gray-200 font-medium truncate w-20 text-center group-hover:text-blue-400"
                        onClick={e => { e.stopPropagation(); handleStartRename(item); }}
                      >
                        {item.name}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {contextMenu && (
                <div
                  className="fixed z-50 bg-gray-900 border border-gray-700 rounded shadow-lg py-1 px-2"
                  style={{ top: contextMenu.y, left: contextMenu.x }}
                  onClick={handleCloseContextMenu}
                  onContextMenu={e => e.preventDefault()}
                >
                  {contextMenu.file.folder_id && (
                    <button
                      className="block w-full text-left px-3 py-1 text-sm text-blue-300 hover:bg-gray-800 rounded"
                      onClick={() => handleMoveToRoot(contextMenu.file)}
                    >
                      Move to Root
                    </button>
                  )}
                  <button
                    className="block w-full text-left px-3 py-1 text-sm text-gray-300 hover:bg-gray-800 rounded"
                    onClick={handleCloseContextMenu}
                  >
                    Cancel
                  </button>
                </div>
              )}
              {/* Breadcrumb Path Bar */}
              <div className="w-full max-w-2xl mx-auto mt-8 flex items-center gap-2 justify-center select-none">
                <span className="text-xs text-gray-400 font-bold mr-2">PATH =</span>
                {/* Root drop target */}
                <div
                  className={`px-3 py-1 rounded cursor-pointer ${draggedFileId ? 'bg-blue-900/30 border border-blue-400' : 'bg-gray-800 border border-gray-700'}`}
                  onDragOver={handleFolderDragOver}
                  onDrop={() => handleFolderDrop(null)}
                  title="Move to Root"
                >
                  Root
                </div>
                {breadcrumbPath.map((folder, idx) => (
                  <React.Fragment key={folder.id}>
                    <span className="text-gray-500 mx-1">/</span>
                    <div
                      className={`px-3 py-1 rounded cursor-pointer ${draggedFileId ? 'bg-blue-900/30 border border-blue-400' : 'bg-gray-800 border border-gray-700'}`}
                      onDragOver={handleFolderDragOver}
                      onDrop={() => handleFolderDrop(folder.id)}
                      title={folder.name}
                    >
                      {folder.name}
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 