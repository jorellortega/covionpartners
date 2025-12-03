'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Upload, 
  Download, 
  File, 
  Folder, 
  Trash2, 
  Edit, 
  RefreshCw,
  HardDrive,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface DropboxFile {
  name: string;
  path_lower: string;
  path_display: string;
  id: string;
  '.tag': 'file' | 'folder';
  size?: number;
  client_modified?: string;
  server_modified?: string;
}

export default function TestCloudPage() {
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState<DropboxFile[]>([]);
  const [currentPath, setCurrentPath] = useState('');
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadPath, setUploadPath] = useState('/test');
  const [systemConnected, setSystemConnected] = useState(false);

  useEffect(() => {
    checkSystemConnection();
    listFiles('');
  }, []);

  const checkSystemConnection = async () => {
    try {
      const response = await fetch('/api/test-cloud/check-connection');
      const data = await response.json();
      setSystemConnected(data.connected);
      if (!data.connected) {
        toast.error('System Dropbox not connected. Please connect it from /admin/cloud-services');
      }
    } catch (error) {
      console.error('Error checking connection:', error);
    }
  };

  const listFiles = async (path: string = '') => {
    try {
      setLoading(true);
      const response = await fetch(`/api/test-cloud/list?path=${encodeURIComponent(path)}`);
      
      if (response.ok) {
        const data = await response.json();
        setFiles(data.entries || []);
        setCurrentPath(path);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to list files');
      }
    } catch (error) {
      console.error('Error listing files:', error);
      toast.error('Failed to list files');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }

    try {
      setUploading(true);
      
      // For files larger than 4MB, use direct client-to-Dropbox upload
      // This bypasses Vercel's request body size limits
      const fileSize = selectedFile.size;
      const useDirectUpload = fileSize > 4 * 1024 * 1024; // 4MB

      if (useDirectUpload) {
        // Get upload URL/token from server
        const urlResponse = await fetch('/api/test-cloud/get-upload-url', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            path: uploadPath.endsWith(selectedFile.name) 
              ? uploadPath 
              : `${uploadPath}/${selectedFile.name}`,
            fileSize: fileSize,
          }),
        });

        if (!urlResponse.ok) {
          const error = await urlResponse.json();
          toast.error(error.error || 'Failed to get upload URL');
          return;
        }

        const uploadInfo = await urlResponse.json();

        // Upload directly to Dropbox from client
        if (uploadInfo.uploadType === 'session') {
          // Large file - use upload session
          await uploadLargeFile(selectedFile, uploadInfo);
        } else {
          // Medium file - direct upload
          await uploadDirect(selectedFile, uploadInfo);
        }
      } else {
        // Small file - upload through API route (simpler)
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('path', uploadPath);

        const response = await fetch('/api/test-cloud/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          toast.error(error.error || 'Failed to upload file');
          return;
        }
      }

      toast.success('File uploaded successfully!');
      setSelectedFile(null);
      // Reset file input
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      // Refresh file list
      listFiles(currentPath);
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const uploadDirect = async (file: File, uploadInfo: any) => {
    const arrayBuffer = await file.arrayBuffer();
    const finalPath = uploadInfo.path.endsWith(file.name) 
      ? uploadInfo.path 
      : `${uploadInfo.path}/${file.name}`;

    const response = await fetch(uploadInfo.uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${uploadInfo.accessToken}`,
        'Content-Type': 'application/octet-stream',
        'Dropbox-API-Arg': JSON.stringify({
          path: finalPath,
          mode: 'overwrite',
          autorename: true,
          mute: false,
        }),
      },
      body: arrayBuffer,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error);
    }
  };

  const uploadLargeFile = async (file: File, uploadInfo: any) => {
    const chunkSize = 4 * 1024 * 1024; // 4MB chunks
    const arrayBuffer = await file.arrayBuffer();
    const totalSize = arrayBuffer.byteLength;
    let offset = 0;
    let sessionId = uploadInfo.sessionId;
    const finalPath = uploadInfo.path.endsWith(file.name) 
      ? uploadInfo.path 
      : `${uploadInfo.path}/${file.name}`;

    // Upload first chunk (session already started by server, but we need to send first chunk)
    const firstChunk = arrayBuffer.slice(0, Math.min(chunkSize, totalSize));
    offset = firstChunk.byteLength;

    // If file is smaller than chunk size, finish immediately
    if (totalSize <= chunkSize) {
      const response = await fetch('https://content.dropboxapi.com/2/files/upload_session/finish', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${uploadInfo.accessToken}`,
          'Content-Type': 'application/octet-stream',
          'Dropbox-API-Arg': JSON.stringify({
            cursor: {
              session_id: sessionId,
              offset: 0,
            },
            commit: {
              path: finalPath,
              mode: 'overwrite',
              autorename: true,
              mute: false,
            },
          }),
        },
        body: firstChunk,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }
      return;
    }

    // Upload first chunk by appending (session was started empty)
    let response = await fetch('https://content.dropboxapi.com/2/files/upload_session/append_v2', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${uploadInfo.accessToken}`,
        'Content-Type': 'application/octet-stream',
        'Dropbox-API-Arg': JSON.stringify({
          cursor: {
            session_id: sessionId,
            offset: 0,
          },
          close: false,
        }),
      },
      body: firstChunk,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error);
    }

    // Upload remaining chunks
    while (offset < totalSize) {
      const chunk = arrayBuffer.slice(offset, Math.min(offset + chunkSize, totalSize));
      const isLastChunk = offset + chunk.length >= totalSize;

      if (isLastChunk) {
        // Last chunk - finish upload
        response = await fetch('https://content.dropboxapi.com/2/files/upload_session/finish', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${uploadInfo.accessToken}`,
            'Content-Type': 'application/octet-stream',
            'Dropbox-API-Arg': JSON.stringify({
              cursor: {
                session_id: sessionId,
                offset: offset,
              },
              commit: {
                path: finalPath,
                mode: 'overwrite',
                autorename: true,
                mute: false,
              },
            }),
          },
          body: chunk,
        });
      } else {
        // Middle chunk - append
        response = await fetch('https://content.dropboxapi.com/2/files/upload_session/append_v2', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${uploadInfo.accessToken}`,
            'Content-Type': 'application/octet-stream',
            'Dropbox-API-Arg': JSON.stringify({
              cursor: {
                session_id: sessionId,
                offset: offset,
              },
              close: false,
            }),
          },
          body: chunk,
        });
      }

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      offset += chunk.byteLength;
    }
  };

  const handleDownload = async (file: DropboxFile) => {
    if (file['.tag'] === 'folder') {
      listFiles(file.path_display);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/test-cloud/download?path=${encodeURIComponent(file.path_display)}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('File downloaded successfully!');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to download file');
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (file: DropboxFile) => {
    if (!confirm(`Are you sure you want to delete "${file.name}"?`)) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/test-cloud/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path: file.path_display }),
      });

      if (response.ok) {
        toast.success('File deleted successfully!');
        listFiles(currentPath);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete file');
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Failed to delete file');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async () => {
    const folderName = prompt('Enter folder name:');
    if (!folderName) return;

    const folderPath = currentPath 
      ? `${currentPath}/${folderName}` 
      : `/${folderName}`;

    try {
      setLoading(true);
      const response = await fetch('/api/test-cloud/create-folder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ path: folderPath }),
      });

      if (response.ok) {
        toast.success('Folder created successfully!');
        listFiles(currentPath);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to create folder');
      }
    } catch (error) {
      console.error('Error creating folder:', error);
      toast.error('Failed to create folder');
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Test System Cloud Services</h1>
        <p className="text-muted-foreground">
          Test Dropbox operations using the system-wide connection
        </p>
      </div>

      {/* Connection Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            System Dropbox Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            {systemConnected ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-green-600 font-medium">Connected</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 text-red-500" />
                <span className="text-red-600 font-medium">Not Connected</span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.location.href = '/admin/cloud-services'}
                  className="ml-4"
                >
                  Connect System Dropbox
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upload Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload File
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Upload Path</label>
              <Input
                value={uploadPath}
                onChange={(e) => setUploadPath(e.target.value)}
                placeholder="/test/filename.txt"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Select File</label>
              <Input
                id="file-input"
                type="file"
                onChange={handleFileSelect}
              />
            </div>
            <Button 
              onClick={handleUpload}
              disabled={!selectedFile || uploading || !systemConnected}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* File Operations */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <File className="h-5 w-5" />
              Files & Folders
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => listFiles(currentPath)}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCreateFolder}
                disabled={loading || !systemConnected}
              >
                <Folder className="h-4 w-4 mr-2" />
                New Folder
              </Button>
              {currentPath && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const parentPath = currentPath.split('/').slice(0, -1).join('/') || '';
                    listFiles(parentPath);
                  }}
                >
                  ← Back
                </Button>
              )}
            </div>
          </div>
          <CardDescription>
            Current Path: <code className="text-xs bg-muted px-1 py-0.5 rounded">{currentPath || '/'}</code>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No files or folders found
            </div>
          ) : (
            <div className="space-y-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {file['.tag'] === 'folder' ? (
                      <Folder className="h-5 w-5 text-blue-500" />
                    ) : (
                      <File className="h-5 w-5 text-gray-500" />
                    )}
                    <div className="flex-1">
                      <div className="font-medium">{file.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {file['.tag'] === 'file' ? (
                          <>
                            {formatFileSize(file.size)} • Modified: {formatDate(file.client_modified)}
                          </>
                        ) : (
                          'Folder'
                        )}
                      </div>
                    </div>
                    {file['.tag'] === 'folder' && (
                      <Badge variant="secondary">Folder</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(file)}
                      disabled={loading}
                    >
                      {file['.tag'] === 'folder' ? (
                        <>
                          <Folder className="h-4 w-4 mr-1" />
                          Open
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </>
                      )}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(file)}
                      disabled={loading || !systemConnected}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Test Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• This page uses the <strong>system-wide Dropbox connection</strong></p>
            <p>• All operations are performed using the platform's Dropbox account</p>
            <p>• Files are stored in the system Dropbox, not user-specific storage</p>
            <p>• Only admins/CEOs can manage the system connection at <code>/admin/cloud-services</code></p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

