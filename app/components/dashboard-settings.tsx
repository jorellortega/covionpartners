"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter 
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import {
  Bell,
  MessageSquare,
  Briefcase,
  DollarSign,
  Users,
  FolderKanban,
  Settings,
  Plus,
  X,
  Lock,
  BarChart3,
  Layout,
  List,
  Bot,
  Calendar,
  FileText,
  Calculator,
  Building2,
  Globe,
  Search,
  PenSquare,
  Wallet
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

interface DashboardApp {
  id: string
  name: string
  icon: React.ReactNode
  route: string
  description: string
}

const AVAILABLE_APPS: DashboardApp[] = [
  {
    id: 'updates',
    name: 'Updates',
    icon: <Bell className="w-5 h-5" />,
    route: '/updates',
    description: 'View notifications and updates'
  },
  {
    id: 'messages',
    name: 'Messages',
    icon: <MessageSquare className="w-5 h-5" />,
    route: '/messages',
    description: 'Access your messages'
  },
  {
    id: 'projects',
    name: 'Projects',
    icon: <Briefcase className="w-5 h-5" />,
    route: '/projects',
    description: 'Manage your projects'
  },
  {
    id: 'withdraw',
    name: 'Withdraw',
    icon: <DollarSign className="w-5 h-5" />,
    route: '/withdraw',
    description: 'Withdraw funds'
  },
  {
    id: 'feed',
    name: 'Activity Feed',
    icon: <Users className="w-5 h-5" />,
    route: '/feed',
    description: 'View activity feed'
  },
  {
    id: 'workspace',
    name: 'Workspace',
    icon: <FolderKanban className="w-5 h-5" />,
    route: '/workmode',
    description: 'Access workspace tools'
  },
  {
    id: 'analytics',
    name: 'Analytics',
    icon: <BarChart3 className="w-5 h-5" />,
    route: '/analytics',
    description: 'View analytics dashboard'
  },
  {
    id: 'calendar',
    name: 'Calendar',
    icon: <Calendar className="w-5 h-5" />,
    route: '/schedule',
    description: 'Manage your schedule'
  },
  {
    id: 'contracts',
    name: 'Contracts',
    icon: <FileText className="w-5 h-5" />,
    route: '/contract-library',
    description: 'Manage contracts'
  },
  {
    id: 'calculator',
    name: 'Calculator',
    icon: <Calculator className="w-5 h-5" />,
    route: '/calculator',
    description: 'Business calculator'
  },
  {
    id: 'organizations',
    name: 'Organizations',
    icon: <Building2 className="w-5 h-5" />,
    route: '/myorganizations',
    description: 'Manage organizations'
  },
  {
    id: 'marketplace',
    name: 'Marketplace',
    icon: <Globe className="w-5 h-5" />,
    route: '/marketplace',
    description: 'Browse marketplace'
  },
  {
    id: 'search',
    name: 'Search',
    icon: <Search className="w-5 h-5" />,
    route: '/search',
    description: 'Search platform'
  },
  {
    id: 'notes',
    name: 'Notes',
    icon: <PenSquare className="w-5 h-5" />,
    route: '/notes',
    description: 'Manage your notes'
  },
  {
    id: 'payments',
    name: 'Payments',
    icon: <Wallet className="w-5 h-5" />,
    route: '/managepayments',
    description: 'Manage payments'
  }
]

interface DashboardSettingsProps {
  onSettingsChange: (selectedApps: string[]) => void
  currentApps: string[]
  isViewLocked?: boolean
  onViewLockToggle?: () => void
  currentView?: string
  onViewChange?: (view: 'default' | 'compact' | 'grid' | 'ai') => void
}

export function DashboardSettings({ onSettingsChange, currentApps, isViewLocked, onViewLockToggle, currentView, onViewChange }: DashboardSettingsProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [selectedApps, setSelectedApps] = useState<string[]>(currentApps)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  


  useEffect(() => {
    setSelectedApps(currentApps)
  }, [currentApps])

  const addApp = (appId: string) => {
    if (selectedApps.length >= 6) {
      toast({
        title: "Maximum reached",
        description: "You can only have 6 apps in your quick access",
        variant: "destructive"
      })
      return
    }
    
    if (!selectedApps.includes(appId)) {
      setSelectedApps(prev => [...prev, appId])
    }
  }

  const removeApp = (appId: string) => {
    setSelectedApps(prev => prev.filter(id => id !== appId))
  }

  const saveSettings = async () => {
    if (!user?.id) return
    
    setLoading(true)
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          dashboard_apps: selectedApps
        }, {
          onConflict: 'user_id'
        })

      if (error) throw error

      onSettingsChange(selectedApps)
      setIsOpen(false)
      toast({
        title: "Settings saved",
        description: "Your dashboard preferences have been updated",
        variant: "default"
      })
    } catch (error) {
      console.error('Error saving dashboard settings:', error)
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const resetToDefaults = () => {
    setSelectedApps(['updates', 'messages', 'projects', 'withdraw', 'feed', 'workspace'])
  }

  const availableApps = AVAILABLE_APPS.filter(app => !selectedApps.includes(app.id))
  const selectedAppDetails = selectedApps.map(id => AVAILABLE_APPS.find(app => app.id === id)).filter(Boolean) as DashboardApp[]

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 text-gray-400 hover:text-white hover:bg-gray-800/50 rounded-full"
        >
          <Settings className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto bg-[#141414] text-white border-gray-700">
        <DialogHeader>
          <DialogTitle>Dashboard Settings</DialogTitle>
          <DialogDescription>
            Customize your dashboard apps and preferences.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* View Lock Settings */}
          {onViewLockToggle && (
            <div>
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <Layout className="w-5 h-5 mr-2 text-blue-400" />
                Dashboard View
              </h3>
              <div className="p-4 bg-gray-700/30 rounded-lg border border-gray-600">
                <p className="text-sm text-gray-400 mb-3">
                  Choose your preferred dashboard view and lock it to prevent accidental changes
                </p>
                
                <div className="flex gap-2 mb-3">
                  <Button
                    variant={currentView === 'default' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => {
                      if (currentView !== 'default') {
                        onViewChange?.('default')
                      }
                    }}
                  >
                    Default
                    {isViewLocked && currentView === 'default' && <Lock className="w-3 h-3 ml-2" />}
                  </Button>
                  <Button
                    variant={currentView === 'compact' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => {
                      if (currentView !== 'compact') {
                        onViewChange?.('compact')
                      }
                    }}
                  >
                    Compact
                    {isViewLocked && currentView === 'compact' && <Lock className="w-3 h-3 ml-2" />}
                  </Button>
                  <Button
                    variant={currentView === 'ai' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => {
                      if (currentView !== 'ai') {
                        onViewChange?.('ai')
                      }
                    }}
                  >
                    AI
                    {isViewLocked && currentView === 'ai' && <Lock className="w-3 h-3 ml-2" />}
                  </Button>
                </div>
                              </div>


              </div>
            )}

          {/* Selected Apps */}
          <div>
            <h3 className="text-lg font-semibold mb-3">
              Selected Apps ({selectedApps.length}/6)
            </h3>
            {selectedAppDetails.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                No apps selected. Add some from the available apps below.
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {selectedAppDetails.map((app) => (
                  <Card key={app.id} className="border-gray-600 bg-gray-700/30">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {app.icon}
                          <span className="font-medium text-white text-sm">{app.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeApp(app.id)}
                          className="h-6 w-6 text-red-400 hover:text-red-300"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-gray-400">{app.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Available Apps */}
          <div>
            <h3 className="text-lg font-semibold mb-3">
              Available Apps
            </h3>
            {availableApps.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                All apps are already selected.
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {availableApps.map((app) => (
                  <Card 
                    key={app.id} 
                    className="border-gray-600 bg-gray-700/20"
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {app.icon}
                          <span className="font-medium text-white text-sm">{app.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => addApp(app.id)}
                          className="h-6 w-6 text-green-400"
                          disabled={selectedApps.length >= 6}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-gray-400">{app.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-3 pt-6 border-t border-gray-700">
          <Button
            variant="outline"
            onClick={resetToDefaults}
            className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white transition-all duration-200"
          >
            Reset to Defaults
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white transition-all duration-200"
          >
            Cancel
          </Button>
          <Button
            onClick={saveSettings}
            disabled={loading}
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg transition-all duration-200 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
