'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft,
  RefreshCw,
  Settings,
  FileText,
  Folder,
  Download,
  Upload,
  CheckCircle,
  AlertCircle,
  Clock,
  HardDrive,
  User,
  Mail,
  Calendar
} from 'lucide-react';

interface CloudServiceConnection {
  id: string;
  service_id: string;
  service_name: string;
  account_info: {
    name: string;
    email: string;
    picture?: string;
  };
  last_sync: string;
  is_active: boolean;
  scopes: string[];
}

interface SyncLog {
  id: string;
  sync_type: string;
  status: string;
  files_processed: number;
  files_added: number;
  files_updated: number;
  files_deleted: number;
  error_message?: string;
  started_at: string;
  completed_at?: string;
}

interface FileItem {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  is_folder: boolean;
  last_modified: string;
  sync_status: string;
}

const serviceIcons: { [key: string]: React.ReactNode } = {
  'google-drive': <HardDrive className="h-6 w-6 text-blue-500" />,
  'dropbox': <HardDrive className="h-6 w-6 text-blue-600" />,
  'onedrive': <HardDrive className="h-6 w-6 text-blue-700" />,
  'box': <HardDrive className="h-6 w-6 text-blue-800" />,
};

export default function CloudServiceManagementPage() {
  const params = useParams();
  const router = useRouter();
  const serviceId = params.serviceId as string;
  
  const [connection, setConnection] = useState<CloudServiceConnection | null>(null);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (serviceId) {
      loadServiceData();
    }
  }, [serviceId]);

  const loadServiceData = async () => {
    try {
      setLoading(true);
      
      // Load connection details
      const connectionResponse = await fetch(`/api/cloud-services/connections`);
      if (connectionResponse.ok) {
        const connections = await connectionResponse.json();
        const currentConnection = connections.find((conn: any) => conn.service_id === serviceId);
        setConnection(currentConnection);
      }

      // Load sync logs
      const logsResponse = await fetch(`/api/cloud-services/${serviceId}/sync-logs`);
      if (logsResponse.ok) {
        const logs = await logsResponse.json();
        setSyncLogs(logs);
      }

      // Load files
      const filesResponse = await fetch(`/api/cloud-services/${serviceId}/files`);
      if (filesResponse.ok) {
        const filesData = await filesResponse.json();
        setFiles(filesData);
      }
    } catch (error) {
      console.error('Failed to load service data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      const response = await fetch(`/api/cloud-services/${serviceId}/sync`, {
        method: 'POST',
      });
      
      if (response.ok) {
        await loadServiceData(); // Reload data after sync
      } else {
        throw new Error('Sync failed');
      }
    } catch (error) {
      console.error('Sync failed:', error);
      alert('Sync failed. Please try again.');
    } finally {
      setSyncing(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'started':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!connection) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Service Not Found</h1>
          <p className="text-muted-foreground mb-4">The requested cloud service connection was not found.</p>
          <Button onClick={() => router.push('/cloud-services')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cloud Services
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => router.push('/cloud-services')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Cloud Services
        </Button>
        
        <div className="flex items-center space-x-3 mb-2">
          {serviceIcons[serviceId]}
          <h1 className="text-3xl font-bold">{connection.service_name}</h1>
          <Badge variant={connection.is_active ? "default" : "secondary"}>
            {connection.is_active ? "Active" : "Inactive"}
          </Badge>
        </div>
        <p className="text-muted-foreground">
          Manage your {connection.service_name} integration and view sync status
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Connection Info */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2" />
                Account Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                {connection.account_info.picture && (
                  <img 
                    src={connection.account_info.picture} 
                    alt="Profile" 
                    className="w-10 h-10 rounded-full"
                  />
                )}
                <div>
                  <p className="font-medium">{connection.account_info.name}</p>
                  <p className="text-sm text-muted-foreground flex items-center">
                    <Mail className="h-3 w-3 mr-1" />
                    {connection.account_info.email}
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <p className="text-sm font-medium">Last Sync</p>
                <p className="text-sm text-muted-foreground flex items-center">
                  <Calendar className="h-3 w-3 mr-1" />
                  {new Date(connection.last_sync).toLocaleString()}
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">Permissions</p>
                <div className="space-y-1">
                  {connection.scopes.map((scope, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {scope}
                    </Badge>
                  ))}
                </div>
              </div>

              <Button 
                onClick={handleSync} 
                disabled={syncing}
                className="w-full"
              >
                {syncing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sync Now
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Sync Logs and Files */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Sync Logs */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Sync Activity</CardTitle>
              <CardDescription>View your recent file synchronization history</CardDescription>
            </CardHeader>
            <CardContent>
              {syncLogs.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No sync activity yet</p>
              ) : (
                <div className="space-y-3">
                  {syncLogs.slice(0, 5).map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(log.status)}
                        <div>
                          <p className="font-medium capitalize">{log.sync_type} Sync</p>
                          <p className="text-sm text-muted-foreground">
                            {log.files_processed} files processed
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {log.files_added} added, {log.files_updated} updated
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(log.started_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Files */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Files</CardTitle>
              <CardDescription>Files synced from your cloud storage</CardDescription>
            </CardHeader>
            <CardContent>
              {files.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No files synced yet</p>
              ) : (
                <div className="space-y-2">
                  {files.slice(0, 10).map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center space-x-3">
                        {file.is_folder ? (
                          <Folder className="h-4 w-4 text-blue-500" />
                        ) : (
                          <FileText className="h-4 w-4 text-gray-500" />
                        )}
                        <div>
                          <p className="font-medium">{file.file_name}</p>
                          <p className="text-xs text-muted-foreground">{file.file_path}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">{formatFileSize(file.file_size)}</p>
                        <Badge 
                          variant={file.sync_status === 'synced' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {file.sync_status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
