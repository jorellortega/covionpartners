"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useUpdates } from '@/hooks/useUpdates'
import { Home, Search, RefreshCw, ArrowRight, Plus, Edit, Trash2, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'sonner'

export default function UpdatesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { updates, loading, error, refreshUpdates, createUpdate, deleteUpdate } = useUpdates()
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [updateToDeleteId, setUpdateToDeleteId] = useState<number | null>(null)
  const [newUpdate, setNewUpdate] = useState({
    title: '',
    description: '',
    status: 'new',
    date: new Date().toISOString().split('T')[0],
    category: '',
    full_content: '',
  })

  const filteredUpdates = updates.filter(update =>
    update.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    update.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    update.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCreateUpdate = async () => {
    const { data, error } = await createUpdate(newUpdate)
    if (error) {
      toast.error(error)
    } else {
      toast.success('Update created successfully')
      setShowCreateDialog(false)
      setNewUpdate({
        title: '',
        description: '',
        status: 'new',
        date: new Date().toISOString().split('T')[0],
        category: '',
        full_content: '',
      })
    }
  }

  const confirmDeleteUpdate = async () => {
    if (updateToDeleteId === null) return; 
    
    const { error } = await deleteUpdate(updateToDeleteId);
    if (error) {
      toast.error(error);
    } else {
      toast.success('Update deleted successfully');
    }
    setUpdateToDeleteId(null);
    setShowDeleteConfirm(false);
  };

  const handleDeleteClick = (id: number) => {
    setUpdateToDeleteId(id);
    setShowDeleteConfirm(true);
  };

  const canManageUpdates = user?.role === 'partner' || user?.role === 'admin'

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-red-500">{error}</p>
        <Button onClick={refreshUpdates}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => router.push('/dashboard')}
                className="hover:bg-accent"
              >
                <Home className="h-5 w-5" />
              </Button>
              <h1 className="text-3xl font-bold">Updates</h1>
            </div>
          </div>

          <div className="flex justify-end gap-2 mb-4">
            {canManageUpdates && (
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Update
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Update</DialogTitle>
                    <DialogDescription>
                      Create a new update to share with your team.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <label className="text-sm font-medium">Title</label>
                      <Input
                        value={newUpdate.title}
                        onChange={(e) => setNewUpdate(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter update title"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Description</label>
                      <Input
                        value={newUpdate.description}
                        onChange={(e) => setNewUpdate(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Enter update description"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Category</label>
                      <Input
                        value={newUpdate.category}
                        onChange={(e) => setNewUpdate(prev => ({ ...prev, category: e.target.value }))}
                        placeholder="Enter update category"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Full Content</label>
                      <Input
                        value={newUpdate.full_content}
                        onChange={(e) => setNewUpdate(prev => ({ ...prev, full_content: e.target.value }))}
                        placeholder="Enter full content"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateUpdate}>
                      Create Update
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            <Button onClick={refreshUpdates} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search updates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {filteredUpdates.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <p className="text-gray-500 text-center">
                {searchQuery
                  ? 'No updates found matching your search.'
                  : 'No updates available at the moment.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredUpdates.map((update) => (
              <Card 
                key={update.id} 
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle>{update.title}</CardTitle>
                    <Badge variant={update.status === 'completed' ? 'default' : 'secondary'}>
                      {update.status}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline">{update.category}</Badge>
                    <span className="text-sm text-gray-500">
                      {new Date(update.date).toLocaleDateString()}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{update.description}</p>
                  <div className="flex justify-between items-center">
                    <Button variant="ghost" onClick={() => router.push(`/updates/${update.id}`)}>
                      View Details
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                    {canManageUpdates && (
                      <div className="flex gap-2">
                        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="hover:bg-red-900/20 hover:text-red-400"
                              onClick={() => handleDeleteClick(update.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the update.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={() => setUpdateToDeleteId(null)}>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={confirmDeleteUpdate} 
                                className="bg-red-600 hover:bg-red-700">
                                  Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 