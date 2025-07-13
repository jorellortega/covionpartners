"use client";
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { UploadCloud, Trash2, Pencil } from 'lucide-react';

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
    setUploading(true);
    // Fetch project_id for this timeline_id
    const { data: timelineRow, error: timelineError } = await supabase
      .from('project_timeline')
      .select('project_id')
      .eq('id', timelineId)
      .maybeSingle();
    if (timelineError || !timelineRow?.project_id) {
      alert('Could not determine project for this timeline item.');
      setUploading(false);
      return;
    }
    const projectId = timelineRow.project_id;
    // Use partnerfiles bucket and timeline_files subfolder
    const filePath = `timeline_files/${timelineId}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('partnerfiles')
      .upload(filePath, file);
    if (uploadError) {
      alert('Upload failed');
      setUploading(false);
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
    setUploading(false);
    // Refresh file list
    const { data: newFiles } = await supabase
      .from('timeline_files')
      .select('*')
      .eq('timeline_id', timelineId)
      .order('uploaded_at', { ascending: false });
    setFiles(newFiles || []);
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

  // Handle input change
  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  };

  // Drag and drop handlers
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
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };
  const onZoneClick = () => {
    inputRef.current?.click();
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
            className="hidden"
          />
          <UploadCloud className={`mx-auto mb-2 ${uploading ? 'animate-bounce text-blue-400' : 'text-blue-400'} w-12 h-12`} />
          <span className="block text-lg font-semibold text-blue-200 mb-1">
            {uploading ? 'Uploading...' : 'Drag & drop to upload'}
          </span>
          <span className="block text-xs text-gray-400">or click to choose a file</span>
        </div>
      )}
      <ul className="mt-4 space-y-2">
        {files.map(f => {
          const url = supabase.storage.from('partnerfiles').getPublicUrl(f.file_url).data.publicUrl;
          const isImage = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(f.file_name);
          const isPDF = /\.pdf$/i.test(f.file_name);
          return (
            <li key={f.id} className="flex items-center gap-6 bg-gray-900/60 rounded-lg p-4">
              {isImage ? (
                <img src={url} alt={f.file_name} className="w-28 h-28 object-cover rounded border border-gray-700" />
              ) : isPDF ? (
                <span className="w-28 h-28 flex items-center justify-center bg-red-100/10 rounded border border-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                </span>
              ) : (
                <span className="w-28 h-28 flex items-center justify-center bg-gray-700/40 rounded border border-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10V6a5 5 0 0110 0v4" /></svg>
                </span>
              )}
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
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-100 block truncate text-lg no-underline hover:text-blue-400 transition-colors"
                      download
                    >
                      {f.file_name}
                    </a>
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
              <button
                className="ml-2 p-2 rounded hover:bg-red-900/40 transition-colors"
                title="Delete file"
                onClick={() => handleDelete(f)}
                disabled={uploading}
              >
                <Trash2 className="w-6 h-6 text-red-400" />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
} 