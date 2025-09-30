'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Cloud, 
  HardDrive, 
  CheckCircle, 
  AlertCircle,
  ExternalLink,
  Settings,
  Trash2
} from 'lucide-react';

interface CloudService {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  connected: boolean;
  accountInfo?: {
    email: string;
    name: string;
  };
  lastSync?: string;
}

const cloudServices: CloudService[] = [
  {
    id: 'google-drive',
    name: 'Google Drive',
    icon: <HardDrive className="h-6 w-6 text-blue-500" />,
    description: 'Access and sync files from your Google Drive account',
    connected: false,
  },
  {
    id: 'dropbox',
    name: 'Dropbox',
    icon: <HardDrive className="h-6 w-6 text-blue-600" />,
    description: 'Connect to your Dropbox account for file storage',
    connected: false,
  },
  {
    id: 'onedrive',
    name: 'OneDrive',
    icon: <HardDrive className="h-6 w-6 text-blue-700" />,
    description: 'Sync files with your Microsoft OneDrive',
    connected: false,
  },
  {
    id: 'box',
    name: 'Box',
    icon: <HardDrive className="h-6 w-6 text-blue-800" />,
    description: 'Enterprise file sharing and collaboration',
    connected: false,
  },
];

export default function CloudServicesPage() {
  const [services, setServices] = useState<CloudService[]>(cloudServices);
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    console.log('🔍 CloudServicesPage: Component mounted');
    console.log('🔍 CloudServicesPage: Initial services state:', services);
    console.log('🔍 CloudServicesPage: Loading state:', loading);
    
    // Load connected services from API
    loadConnectedServices();

    // Check for OAuth callback success/error in URL params
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const error = urlParams.get('error');
    
    if (success === 'connected') {
      console.log('🔍 OAuth callback successful, reloading connections...');
      setTimeout(() => loadConnectedServices(), 1000); // Reload after a short delay
    } else if (error) {
      console.log('🔍 OAuth callback error:', error);
    }
  }, []);

  const loadConnectedServices = async () => {
    try {
      console.log('🔍 Loading connected services...');
      const response = await fetch('/api/cloud-services/connections');
      console.log('🔍 Connections response status:', response.status);
      
      if (response.ok) {
        const connections = await response.json();
        console.log('🔍 Loaded connections:', connections);
        setServices(prev => prev.map(service => ({
          ...service,
          connected: connections.some((conn: any) => conn.service_id === service.id && conn.is_active),
          accountInfo: connections.find((conn: any) => conn.service_id === service.id)?.account_info,
          lastSync: connections.find((conn: any) => conn.service_id === service.id)?.last_sync
        })));
      } else {
        console.log('🔍 No connections available (user may not be authenticated)');
        // Don't show error for 401, just keep services as not connected
      }
    } catch (error) {
      console.log('🔍 Failed to load connected services (user may not be authenticated):', error);
      // Don't show error, just keep services as not connected
    }
  };

  const handleConnect = async (serviceId: string) => {
    console.log('🔍 handleConnect called with serviceId:', serviceId);
    setLoading(prev => {
      const newState = { ...prev, [serviceId]: true };
      console.log('🔍 Updated loading state:', newState);
      return newState;
    });
    
    try {
      console.log('🔍 Initiating OAuth connection for:', serviceId);
      
      const response = await fetch(`/api/cloud-services/connect/${serviceId}`, {
        method: 'POST',
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Received OAuth URL for', serviceId);
        console.log('🔍 Raw authUrl from server:', data.authUrl);
        console.log('🔍 Decoded authUrl:', decodeURIComponent(data.authUrl));
        
        // Test URL parsing
        try {
          const testUrl = new URL(data.authUrl);
          console.log('🔍 Parsed URL hostname:', testUrl.hostname);
          console.log('🔍 Parsed redirect_uri:', testUrl.searchParams.get('redirect_uri'));
        } catch (e) {
          console.error('🔍 URL parsing error:', e);
        }
        
        // Redirect to OAuth provider
        window.location.href = data.authUrl;
      } else {
        const errorData = await response.json();
        console.error('🔍 Connection failed:', response.status, errorData);
        throw new Error(errorData.error || 'Failed to initiate connection');
      }
    } catch (error) {
      console.error('🔍 Connection failed:', error);
      alert('Failed to connect to service. Please try again.');
    } finally {
      setLoading(prev => {
        const newState = { ...prev, [serviceId]: false };
        console.log('🔍 Final loading state:', newState);
        return newState;
      });
    }
  };

  const handleDisconnect = async (serviceId: string) => {
    if (!confirm('Are you sure you want to disconnect this service?')) {
      return;
    }

    setLoading(prev => ({ ...prev, [serviceId]: true }));
    
    try {
      const response = await fetch(`/api/cloud-services/disconnect/${serviceId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setServices(prev => prev.map(service => 
          service.id === serviceId 
            ? { ...service, connected: false, accountInfo: undefined, lastSync: undefined }
            : service
        ));
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to disconnect service');
      }
    } catch (error) {
      console.error('Disconnection failed:', error);
      alert('Failed to disconnect service. Please try again.');
    } finally {
      setLoading(prev => ({ ...prev, [serviceId]: false }));
    }
  };

  const handleManage = (serviceId: string) => {
    window.location.href = `/cloud-services/${serviceId}`;
  };

  // Debug logging inside component
  console.log('🔍 CloudServicesPage: Rendering with services:', services);
  console.log('🔍 CloudServicesPage: Current loading state:', loading);

  // Simple test to make sure the page is working
  if (services.length === 0) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <h1 className="text-3xl font-bold mb-2">Cloud Services Integration</h1>
        <div className="p-4 bg-red-100 border border-red-400 rounded">
          <p className="text-red-800">ERROR: No services loaded!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Cloud Services Integration</h1>
        <p className="text-muted-foreground">
          Connect your cloud storage accounts to seamlessly sync and manage files across platforms.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        {services.map((service) => {
          console.log('🔍 Rendering service card for:', service.id, service);
          return (
          <Card key={service.id} className="relative">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {service.icon}
                  <div>
                    <CardTitle className="text-lg">{service.name}</CardTitle>
                    <CardDescription>{service.description}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {service.connected ? (
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
              {service.connected && service.accountInfo && (
                <div className="mb-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">{service.accountInfo.name}</p>
                  <p className="text-xs text-muted-foreground">{service.accountInfo.email}</p>
                  {service.lastSync && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Last sync: {new Date(service.lastSync).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}

              <div className="flex space-x-2">
                {!service.connected ? (
                  <Button 
                    onClick={() => handleConnect(service.id)}
                    disabled={loading[service.id]}
                    className="flex-1"
                  >
                    {loading[service.id] ? 'Connecting...' : 'Connect'}
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={() => handleManage(service.id)}
                      className="flex-1"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Manage
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={() => handleDisconnect(service.id)}
                      disabled={loading[service.id]}
                    >
                      {loading[service.id] ? 'Disconnecting...' : <Trash2 className="h-4 w-4" />}
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
          );
        })}
      </div>

      <Separator className="my-8" />

      {/* Debug Panel */}
      <Card className="mb-8 border-yellow-200 bg-yellow-50">
        <CardHeader>
          <CardTitle className="text-sm text-yellow-800">Debug Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-yellow-700 space-y-1">
            <p><strong>Services Status:</strong> {services.filter(s => s.connected).length} connected, {services.filter(s => !s.connected).length} not connected</p>
            <p><strong>Loading States:</strong> {Object.keys(loading).filter(key => loading[key]).join(', ') || 'None'}</p>
            <p><strong>Environment:</strong> {process.env.NODE_ENV}</p>
            <p><strong>Site URL:</strong> {process.env.NEXT_PUBLIC_SITE_URL}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Cloud className="h-5 w-5 mr-2" />
            Integration Benefits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <Cloud className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Seamless Sync</h3>
              <p className="text-sm text-muted-foreground">
                Automatically sync files between your cloud storage and Covion Partners
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">Secure Access</h3>
              <p className="text-sm text-muted-foreground">
                OAuth 2.0 authentication ensures your credentials are never stored
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <Settings className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">Easy Management</h3>
              <p className="text-sm text-muted-foreground">
                Connect and disconnect services anytime with full control
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
