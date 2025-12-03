'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Cloud, 
  CheckCircle, 
  AlertCircle,
  ExternalLink,
  Settings,
  Trash2,
  RefreshCw,
  HardDrive,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface SystemConnection {
  id: string;
  service_id: string;
  service_name: string;
  connection_type: 'system';
  account_info: {
    name: string;
    email: string;
    account_id: string;
  };
  is_active: boolean;
  last_sync: string;
  created_at: string;
}

export default function AdminCloudServicesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [connection, setConnection] = useState<SystemConnection | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/login');
          return;
        }

        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (!userData || (userData.role !== 'admin' && userData.role !== 'ceo')) {
          toast.error('Access denied. Admin or CEO role required.');
          setAccessDenied(true);
          router.push('/dashboard');
          return;
        }

        // User has access, load connection
        loadConnection();
      } catch (error) {
        console.error('Error checking access:', error);
        toast.error('Error checking access');
        router.push('/dashboard');
      }
    };

    checkAccess();
  }, [router]);

  const loadConnection = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/cloud-services/system-dropbox');
      
      if (response.ok) {
        const data = await response.json();
        setConnection(data.connection);
      } else {
        const error = await response.json();
        console.error('Failed to load connection:', error);
      }
    } catch (error) {
      console.error('Error loading connection:', error);
      toast.error('Failed to load system Dropbox connection');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      setConnecting(true);
      const response = await fetch('/api/admin/cloud-services/system-dropbox/connect', {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        // Redirect to Dropbox OAuth
        window.location.href = data.authUrl;
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to initiate connection');
      }
    } catch (error) {
      console.error('Connection error:', error);
      toast.error('Failed to connect to Dropbox');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect the system Dropbox? This will affect all users using system storage.')) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/admin/cloud-services/system-dropbox', {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('System Dropbox disconnected successfully');
        setConnection(null);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to disconnect');
      }
    } catch (error) {
      console.error('Disconnection error:', error);
      toast.error('Failed to disconnect Dropbox');
    } finally {
      setLoading(false);
    }
  };

  // Check for OAuth callback success/error
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const error = urlParams.get('error');

    if (success === 'connected') {
      toast.success('System Dropbox connected successfully!');
      loadConnection();
      // Clean up URL
      window.history.replaceState({}, '', '/admin/cloud-services');
    } else if (error) {
      toast.error(`Connection failed: ${error}`);
      // Clean up URL
      window.history.replaceState({}, '', '/admin/cloud-services');
    }
  }, []);

  if (accessDenied) {
    return null; // Will redirect
  }

  if (loading && !connection) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">System Cloud Services</h1>
        <p className="text-muted-foreground">
          Manage platform-wide cloud storage connections. These provide default storage for all users.
        </p>
      </div>

      {/* System Dropbox Connection */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <HardDrive className="h-8 w-8 text-blue-600" />
              <div>
                <CardTitle className="text-xl">System Dropbox</CardTitle>
                <CardDescription>
                  Platform-wide Dropbox account used as default storage for all users
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {connection ? (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Not Connected
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {connection ? (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Account Name</p>
                    <p className="text-base font-semibold">{connection.account_info?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p className="text-base font-semibold">{connection.account_info?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Account ID</p>
                    <p className="text-base font-mono text-sm">{connection.account_info?.account_id || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Last Sync</p>
                    <p className="text-base">
                      {connection.last_sync 
                        ? new Date(connection.last_sync).toLocaleString()
                        : 'Never'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  onClick={loadConnection}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleDisconnect}
                  disabled={loading}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Disconnect
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>No system Dropbox connected.</strong> Users will need to connect their own Dropbox accounts for storage.
                </p>
              </div>

              <Button 
                onClick={handleConnect}
                disabled={connecting}
                className="w-full"
                size="lg"
              >
                {connecting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Connect System Dropbox
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator className="my-8" />

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Cloud className="h-5 w-5 mr-2" />
            How System Storage Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Storage Priority</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>If a user has their own Dropbox connected, their personal storage is used</li>
                <li>If not, the system Dropbox provides default storage</li>
                <li>Users can connect their own accounts anytime for additional storage</li>
              </ol>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-2">Folder Structure</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Files are organized in the system Dropbox as:
              </p>
              <div className="bg-muted p-3 rounded font-mono text-xs">
                <div>/Covion Partners/</div>
                <div className="ml-4">Users/</div>
                <div className="ml-8">{'{userId}'}/</div>
                <div className="ml-12">Projects/</div>
                <div className="ml-16">{'{projectId}'}/</div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="font-semibold mb-2">Requirements</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                <li>Dropbox app must have "Full Dropbox" access (not "App folder")</li>
                <li>Required scopes: files.metadata.write, files.content.write, files.content.read, account_info.read</li>
                <li>System connection is read-only for regular users (admins manage it)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

