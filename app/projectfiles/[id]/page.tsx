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

  useEffect(() => {
    const fetchFiles = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("project_files")
        .select("*")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });
      if (error) {
        toast.error("Failed to fetch files");
        setFiles([]);
      } else {
        setFiles(data || []);
      }
      setLoading(false);
    };
    if (projectId) fetchFiles();
  }, [projectId, isUploading]);

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
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-gray-400 hover:text-blue-400"
                              onClick={() => {
                                setEditingLabel(file.id);
                                setNewLabel(file.custom_label || "");
                                setNewLabelStatus(file.label_status || "draft");
                              }}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
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
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {filteredFiles.map((file, index) => (
                    <div key={file.id} className="flex flex-col items-center p-4 bg-gray-800/50 rounded-lg group hover:bg-gray-800/70 transition-colors">
                      <div className="mb-2">{getFileIcon(file.type)}</div>
                      {editingFileName === file.id ? (
                        <div className="flex flex-col items-center w-full gap-2">
                          <Input
                            value={newFileName}
                            onChange={(e) => setNewFileName(e.target.value)}
                            className="h-8 text-sm w-full"
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleSaveFileName(file)} className="h-8">Save</Button>
                            <Button size="sm" variant="outline" onClick={handleCancelEditFileName} className="h-8">Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <div className="font-semibold text-white text-center truncate w-full mb-1 cursor-pointer hover:text-blue-400" onClick={() => handleStartEditFileName(file)}>{file.name}</div>
                      )}
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
                          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-blue-400" onClick={() => { setEditingLabel(file.id); setNewLabel(file.custom_label || ""); setNewLabelStatus(file.label_status || "draft"); }}><Pencil className="w-4 h-4" /></Button>
                        </div>
                      )}
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
                      <span className="mr-2">{getFileIcon(file.type)}</span>
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
        </CardContent>
      </Card>
    </div>
  );
} 