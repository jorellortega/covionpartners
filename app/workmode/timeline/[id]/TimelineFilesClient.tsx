"use client";
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { UploadCloud, Trash2, Pencil, X, Download } from 'lucide-react';

interface TimelineFilesClientProps {
  timelineId: string;
}

interface TimelineFile {
  id: string;
  file_url: string;
  file_name: string;
  uploaded_at: string;
}

export default function TimelineFilesClient({ timelineId }: TimelineFilesClientProps) {
  const [files, setFiles] = useState<TimelineFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [viewingFile, setViewingFile] = useState<TimelineFile | null>(null);
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    const fetchFiles = async () => {
      const { data } = await supabase
        .from('timeline_files')
        .select('*')
        .eq('timeline_id', timelineId)
        .order('uploaded_at', { ascending: false });
      setFiles(data || []);
    };
    fetchFiles();
  }, [timelineId]);

  const handleUpload = async (file: File) => {
    if (!file || !user) return;
    
    // Fetch project_id for this timeline_id
    const { data: timelineRow, error: timelineError } = await supabase
      .from('project_timeline')
      .select('project_id')
      .eq('id', timelineId)
      .maybeSingle();
    if (timelineError || !timelineRow?.project_id) {
      alert('Could not determine project for this timeline item.');
      return;
    }
    const projectId = timelineRow.project_id;
    
    // Use partnerfiles bucket and timeline_files subfolder
    const filePath = `timeline_files/${timelineId}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('partnerfiles')
      .upload(filePath, file);
    if (uploadError) {
      alert(`Upload failed for ${file.name}`);
      return;
    }
    
    // Save file record with project_id
    await supabase.from('timeline_files').insert({
      timeline_id: timelineId,
      project_id: projectId,
      user_id: user.id,
      file_url: filePath,
      file_name: file.name,
    });
  };

  const handleMultipleUploads = async (fileList: FileList) => {
    if (!fileList || fileList.length === 0) return;
    
    setUploading(true);
    
    try {
      // Convert FileList to array and upload all files
      const filesArray = Array.from(fileList);
      const uploadPromises = filesArray.map(file => handleUpload(file));
      
      // Wait for all uploads to complete
      await Promise.all(uploadPromises);
      
      // Refresh file list after all uploads
      const { data: newFiles } = await supabase
        .from('timeline_files')
        .select('*')
        .eq('timeline_id', timelineId)
        .order('uploaded_at', { ascending: false });
      setFiles(newFiles || []);
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Some files failed to upload. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (file: TimelineFile) => {
    if (!confirm(`Delete file "${file.file_name}"? This cannot be undone.`)) return;
    setUploading(true);
    // Delete from storage
    const { error: storageError } = await supabase.storage.from('partnerfiles').remove([file.file_url]);
    // Delete from DB
    const { error: dbError } = await supabase.from('timeline_files').delete().eq('id', file.id);
    setUploading(false);
    if (storageError || dbError) {
      alert('Failed to delete file.');
      return;
    }
    // Refresh file list
    setFiles(files => files.filter(f => f.id !== file.id));
  };

  const handleRename = async (file: TimelineFile) => {
    if (!editValue.trim() || editValue === file.file_name) {
      setEditingId(null);
      return;
    }
    setUploading(true);
    const { error } = await supabase.from('timeline_files').update({ file_name: editValue }).eq('id', file.id);
    setUploading(false);
    if (error) {
      alert('Failed to rename file.');
      return;
    }
    setFiles(files => files.map(f => f.id === file.id ? { ...f, file_name: editValue } : f));
    setEditingId(null);
  };

  const openFileViewer = (file: TimelineFile) => {
    setViewingFile(file);
  };

  const closeFileViewer = () => {
    setViewingFile(null);
  };

  // Handle input change for multiple files
  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (fileList) {
      handleMultipleUploads(fileList);
    }
  };

  // Drag and drop handlers for multiple files
  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };
  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };
  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleMultipleUploads(e.dataTransfer.files);
    }
  };
  const onZoneClick = () => {
    inputRef.current?.click();
  };

  const renderFileContent = (file: TimelineFile) => {
    const url = supabase.storage.from('partnerfiles').getPublicUrl(file.file_url).data.publicUrl;
    const extension = file.file_name.split('.').pop()?.toLowerCase() || '';
    
    // More comprehensive file type detection
    const isImage = /\.(jpg|jpeg|png|gif|webp|bmp|svg|ico|tiff|tif)$/i.test(file.file_name);
    const isPDF = /\.pdf$/i.test(file.file_name);
    const isText = /\.(txt|md|js|ts|jsx|tsx|css|html|json|xml|csv|log|py|java|cpp|c|php|rb|go|rs|sh|sql|yaml|yml)$/i.test(file.file_name);
    const isVideo = /\.(mp4|webm|ogg|mov|avi|mkv|wmv|flv|m4v|3gp)$/i.test(file.file_name);
    const isAudio = /\.(mp3|wav|ogg|m4a|flac|aac|wma|opus)$/i.test(file.file_name);
    const isDocument = /\.(doc|docx|xls|xlsx|ppt|pptx|odt|ods|odp)$/i.test(file.file_name);
    const isArchive = /\.(zip|rar|7z|tar|gz|bz2|xz)$/i.test(file.file_name);

    console.log('File type detection:', {
      fileName: file.file_name,
      extension,
      isImage,
      isPDF,
      isText,
      isVideo,
      isAudio,
      isDocument,
      isArchive,
      url,
      fileUrl: file.file_url
    });

    // Test if the URL is accessible
    const testUrlAccess = async () => {
      try {
        const response = await fetch(url, { method: 'HEAD' });
        console.log('URL access test:', {
          url,
          status: response.status,
          ok: response.ok,
          headers: Object.fromEntries(response.headers.entries())
        });
        return response.ok;
      } catch (error) {
        console.error('URL access test failed:', error);
        return false;
      }
    };

    // Test URL access immediately
    testUrlAccess();

    if (isImage) {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <img 
            src={url} 
            alt={file.file_name} 
            className="max-w-full max-h-full object-contain"
            onError={(e) => {
              console.error('Image failed to load:', e);
              console.error('Failed URL:', url);
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
            onLoad={() => {
              console.log('Image loaded successfully:', url);
            }}
          />
          <div className="hidden text-center text-gray-400">
            <p>Image failed to load</p>
            <p className="text-sm text-gray-500 mb-2">URL: {url}</p>
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white"
            >
              Open in new tab
            </a>
          </div>
        </div>
      );
    }
    
    if (isPDF) {
      return (
        <div className="w-full h-full">
          <iframe 
            src={url} 
            className="w-full h-full border-0" 
            title={file.file_name}
            onLoad={() => {
              console.log('PDF iframe loaded successfully');
            }}
            onError={(e) => {
              console.error('PDF failed to load:', e);
            }}
          />
          <div className="mt-2 text-center">
            <p className="text-sm text-gray-400 mb-2">If PDF doesn't load above, try:</p>
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm"
            >
              Open PDF in new tab
            </a>
          </div>
        </div>
      );
    }
    
    if (isVideo) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center">
          <video controls className="max-w-full max-h-full">
            <source src={url} type={`video/${extension}`} />
            Your browser does not support the video tag.
          </video>
          <div className="mt-2 text-center">
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm"
            >
              Open video in new tab
            </a>
          </div>
        </div>
      );
    }
    
    if (isAudio) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center">
          <audio controls className="max-w-full">
            <source src={url} type={`audio/${extension}`} />
            Your browser does not support the audio tag.
          </audio>
          <div className="mt-2 text-center">
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm"
            >
              Open audio in new tab
            </a>
          </div>
        </div>
      );
    }
    
    if (isText) {
      return (
        <div className="w-full h-full bg-gray-900 text-gray-100 p-4 rounded overflow-auto">
          <div className="text-center text-gray-400 mb-4">
            <p className="text-lg font-semibold mb-2">Text File: {extension.toUpperCase()}</p>
            <p className="text-sm">Text files are displayed as downloadable content</p>
          </div>
          <div className="text-center">
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white mr-2"
            >
              Open in new tab
            </a>
            <a 
              href={url} 
              download 
              className="inline-flex items-center gap-2 mt-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white"
            >
              <Download className="w-4 h-4" />
              Download
            </a>
          </div>
        </div>
      );
    }

    if (isDocument) {
      // For Word documents, try to use Microsoft Office Online viewer
      const isWordDoc = /\.(doc|docx)$/i.test(file.file_name);
      const isExcelDoc = /\.(xls|xlsx)$/i.test(file.file_name);
      const isPowerPointDoc = /\.(ppt|pptx)$/i.test(file.file_name);
      
      let officeOnlineUrl = '';
      if (isWordDoc) {
        officeOnlineUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
      } else if (isExcelDoc) {
        officeOnlineUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
      } else if (isPowerPointDoc) {
        officeOnlineUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
      }

      return (
        <div className="w-full h-full flex flex-col">
          {officeOnlineUrl && (
            <div className="flex-1 mb-4">
              <div className="text-center text-gray-400 mb-2">
                <p className="text-sm">Attempting to load with Microsoft Office Online viewer...</p>
              </div>
              <iframe 
                src={officeOnlineUrl}
                className="w-full h-full border-0 rounded"
                title={`View ${file.file_name} with Office Online`}
                onLoad={() => {
                  console.log('Office Online viewer loaded successfully');
                }}
                onError={(e) => {
                  console.error('Office Online viewer failed to load:', e);
                }}
              />
            </div>
          )}
          
          <div className="text-center p-4 bg-gray-800/50 rounded">
            <div className="w-16 h-16 flex items-center justify-center bg-blue-100/10 rounded-full mx-auto mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-gray-300 mb-2">
              {isWordDoc ? 'Word Document' : isExcelDoc ? 'Excel Spreadsheet' : isPowerPointDoc ? 'PowerPoint Presentation' : 'Document File'}: {extension.toUpperCase()}
            </p>
            <p className="text-gray-400 mb-4">
              {isWordDoc ? 'Word documents can be viewed with Office Online or downloaded for editing.' :
               isExcelDoc ? 'Excel spreadsheets can be viewed with Office Online or downloaded for editing.' :
               isPowerPointDoc ? 'PowerPoint presentations can be viewed with Office Online or downloaded for editing.' :
               'Document files cannot be previewed in the browser'}
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {officeOnlineUrl && (
                <a 
                  href={officeOnlineUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white"
                >
                  Open in Office Online
                </a>
              )}
              <a 
                href={url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded text-white"
              >
                Open in new tab
              </a>
              <a 
                href={url} 
                download 
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white"
              >
                <Download className="w-4 h-4" />
                Download
              </a>
            </div>
          </div>
        </div>
      );
    }
    
    if (isArchive) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center text-center">
          <div className="w-32 h-32 flex items-center justify-center bg-orange-100/10 rounded-full mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-20 h-20 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <p className="text-lg font-semibold text-gray-300 mb-2">Archive File: {extension.toUpperCase()}</p>
          <p className="text-gray-400 mb-4">Archive files cannot be previewed in the browser</p>
          <a 
            href={url} 
            download 
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 rounded text-white"
          >
            <Download className="w-4 h-4" />
            Download Archive
          </a>
        </div>
      );
    }
    
    // For other file types, show download option
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-center">
        <div className="w-32 h-32 flex items-center justify-center bg-gray-700/40 rounded-full mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-20 h-20 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10V6a5 5 0 0110 0v4" />
          </svg>
        </div>
        <p className="text-lg font-semibold text-gray-300 mb-2">Unknown File Type: {extension.toUpperCase()}</p>
        <p className="text-gray-400 mb-4">This file type cannot be previewed in the browser</p>
        <div className="flex gap-2">
          <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white"
          >
            Open in new tab
          </a>
          <a 
            href={url} 
            download 
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white"
          >
            <Download className="w-4 h-4" />
            Download File
          </a>
        </div>
      </div>
    );
  };

  return (
    <div className="mt-8">
      <h2 className="font-bold mb-2">Files</h2>
      {user && (
        <div
          className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 mb-4 cursor-pointer transition-all duration-200 shadow-sm ${dragActive ? 'border-blue-400 bg-blue-900/10 scale-[1.02]' : 'border-gray-600 bg-gray-800/40 hover:border-blue-500 hover:bg-blue-900/5'}`}
          onClick={onZoneClick}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          <input
            type="file"
            ref={inputRef}
            onChange={onInputChange}
            disabled={uploading}
            multiple
            className="hidden"
          />
          <UploadCloud className={`mx-auto mb-2 ${uploading ? 'animate-bounce text-blue-400' : 'text-blue-400'} w-12 h-12`} />
          <span className="block text-lg font-semibold text-blue-200 mb-1">
            {uploading ? 'Uploading...' : 'Drag & drop to upload'}
          </span>
          <span className="block text-xs text-gray-400">or click to choose files (multiple files supported)</span>
        </div>
      )}
      
      <ul className="mt-4 space-y-2">
        {files.map(f => {
          const url = supabase.storage.from('partnerfiles').getPublicUrl(f.file_url).data.publicUrl;
          const isImage = /\.(jpg|jpeg|png|gif|webp|bmp|svg|ico|tiff|tif)$/i.test(f.file_name);
          const isPDF = /\.pdf$/i.test(f.file_name);
          const isText = /\.(txt|md|js|ts|jsx|tsx|css|html|json|xml|csv|log|py|java|cpp|c|php|rb|go|rs|sh|sql|yaml|yml)$/i.test(f.file_name);
          const isVideo = /\.(mp4|webm|ogg|mov|avi|mkv|wmv|flv|m4v|3gp)$/i.test(f.file_name);
          const isAudio = /\.(mp3|wav|ogg|m4a|flac|aac|wma|opus)$/i.test(f.file_name);
          const isDocument = /\.(doc|docx|xls|xlsx|ppt|pptx|odt|ods|odp)$/i.test(f.file_name);
          const isArchive = /\.(zip|rar|7z|tar|gz|bz2|xz)$/i.test(f.file_name);
          
          return (
            <li key={f.id} className="flex items-center gap-6 bg-gray-900/60 rounded-lg p-4">
              {/* File Preview */}
              <div className="w-28 h-28 flex items-center justify-center rounded border border-gray-700 cursor-pointer hover:border-blue-400 transition-colors" 
                   onClick={() => openFileViewer(f)}>
                {isImage ? (
                  <img src={url} alt={f.file_name} className="w-full h-full object-cover rounded" />
                ) : isPDF ? (
                  <div className="w-full h-full flex items-center justify-center bg-red-100/10 rounded">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                ) : isVideo ? (
                  <div className="w-full h-full flex items-center justify-center bg-blue-100/10 rounded">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                ) : isAudio ? (
                  <div className="w-full h-full flex items-center justify-center bg-green-100/10 rounded">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                  </div>
                ) : isText ? (
                  <div className="w-full h-full flex items-center justify-center bg-yellow-100/10 rounded">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-700/40 rounded">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10V6a5 5 0 0110 0v4" />
                    </svg>
                  </div>
                )}
              </div>
              
              {/* File Info and Actions */}
              <div className="flex-1 min-w-0 flex items-center gap-2">
                {editingId === f.id ? (
                  <input
                    className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-lg text-blue-100 w-full max-w-xs focus:outline-none focus:ring focus:border-blue-400"
                    value={editValue}
                    autoFocus
                    onChange={e => setEditValue(e.target.value)}
                    onBlur={() => handleRename(f)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleRename(f);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                  />
                ) : (
                  <>
                    <button
                      onClick={() => openFileViewer(f)}
                      className="text-blue-100 block truncate text-lg no-underline hover:text-blue-400 transition-colors text-left"
                      title={`Click to view ${f.file_name}`}
                    >
                      {f.file_name}
                    </button>
                    <button
                      className="ml-1 p-1 rounded hover:bg-blue-900/40 transition-colors"
                      title="Rename file"
                      onClick={() => { setEditingId(f.id); setEditValue(f.file_name); }}
                      disabled={uploading}
                    >
                      <Pencil className="w-5 h-5 text-blue-300" />
                    </button>
                  </>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {/* Download Button */}
                <a
                  href={url}
                  download
                  className="p-2 rounded hover:bg-green-900/40 transition-colors"
                  title="Download file"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </a>
                
                {/* Delete Button */}
                <button
                  className="p-2 rounded hover:bg-red-900/40 transition-colors"
                  title="Delete file"
                  onClick={() => handleDelete(f)}
                  disabled={uploading}
                >
                  <Trash2 className="w-6 h-6 text-red-400" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {/* File Viewer Modal */}
      {viewingFile && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg shadow-2xl w-full max-w-6xl h-full max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white truncate">{viewingFile.file_name}</h3>
              <div className="flex items-center gap-2">
                <a
                  href={supabase.storage.from('partnerfiles').getPublicUrl(viewingFile.file_url).data.publicUrl}
                  download
                  className="p-2 rounded hover:bg-gray-700 transition-colors"
                  title="Download file"
                >
                  <Download className="w-5 h-5 text-gray-300" />
                </a>
                <button
                  onClick={closeFileViewer}
                  className="p-2 rounded hover:bg-gray-700 transition-colors"
                  title="Close viewer"
                >
                  <X className="w-5 h-5 text-gray-300" />
                </button>
              </div>
            </div>
            
            {/* Modal Content */}
            <div className="flex-1 p-4 overflow-auto">
              <div className="w-full h-full flex items-center justify-center">
                {renderFileContent(viewingFile)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 