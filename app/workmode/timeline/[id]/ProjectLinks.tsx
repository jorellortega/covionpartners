'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, ExternalLink, Edit, Trash2, Link as LinkIcon, X } from 'lucide-react';
import { toast } from 'sonner';

interface ProjectLink {
  id: string;
  title: string;
  url: string;
  description?: string;
  category: string;
  created_by: string;
  created_at: string;
  user?: {
    name?: string;
    email?: string;
  };
}

interface ProjectLinksProps {
  projectId: string;
}

const LINK_CATEGORIES = [
  'general',
  'research',
  'reference',
  'tool',
  'resource',
  'documentation',
  'design',
  'development',
  'testing',
  'deployment'
];

export default function ProjectLinks({ projectId }: ProjectLinksProps) {
  const { user } = useAuth();
  const [links, setLinks] = useState<ProjectLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<ProjectLink | null>(null);
  const [deletingLink, setDeletingLink] = useState<string | null>(null);
  
  const [newLink, setNewLink] = useState({
    title: '',
    url: '',
    description: '',
    category: 'general'
  });

  useEffect(() => {
    if (projectId) {
      fetchProjectLinks();
    }
  }, [projectId]);

  const fetchProjectLinks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('project_links')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        // Fetch user details for each link
        const linksWithUser = await Promise.all(
          data.map(async (link) => {
            const { data: userData } = await supabase
              .from('users')
              .select('name, email')
              .eq('id', link.created_by)
              .single();
            return {
              ...link,
              user: userData || { name: 'Unknown', email: link.created_by }
            };
          })
        );
        setLinks(linksWithUser);
      }
    } catch (error) {
      console.error('Error fetching project links:', error);
      toast.error('Failed to fetch project links');
    } finally {
      setLoading(false);
    }
  };

  const handleAddLink = async () => {
    if (!newLink.title.trim() || !newLink.url.trim() || !user) {
      toast.error('Please fill in title and URL');
      return;
    }

    try {
      const { error } = await supabase
        .from('project_links')
        .insert([{
          project_id: projectId,
          title: newLink.title.trim(),
          url: newLink.url.trim(),
          description: newLink.description.trim() || null,
          category: newLink.category,
          created_by: user.id
        }]);

      if (error) throw error;

      toast.success('Link added successfully');
      setIsAddModalOpen(false);
      setNewLink({ title: '', url: '', description: '', category: 'general' });
      fetchProjectLinks();
    } catch (error: any) {
      console.error('Error adding link:', error);
      toast.error(error.message || 'Failed to add link');
    }
  };

  const handleEditLink = async () => {
    if (!editingLink || !editingLink.title.trim() || !editingLink.url.trim()) {
      toast.error('Please fill in title and URL');
      return;
    }

    try {
      const { error } = await supabase
        .from('project_links')
        .update({
          title: editingLink.title.trim(),
          url: editingLink.url.trim(),
          description: editingLink.description?.trim() || null,
          category: editingLink.category,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingLink.id);

      if (error) throw error;

      toast.success('Link updated successfully');
      setEditingLink(null);
      fetchProjectLinks();
    } catch (error: any) {
      console.error('Error updating link:', error);
      toast.error(error.message || 'Failed to update link');
    }
  };

  const handleDeleteLink = async (linkId: string) => {
    try {
      setDeletingLink(linkId);
      const { error } = await supabase
        .from('project_links')
        .delete()
        .eq('id', linkId);

      if (error) throw error;

      toast.success('Link deleted successfully');
      fetchProjectLinks();
    } catch (error: any) {
      console.error('Error deleting link:', error);
      toast.error('Failed to delete link');
    } finally {
      setDeletingLink(null);
    }
  };

  const openEditModal = (link: ProjectLink) => {
    setEditingLink(link);
  };

  const closeEditModal = () => {
    setEditingLink(null);
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      research: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
      reference: 'bg-green-500/20 text-green-400 border-green-500/50',
      tool: 'bg-purple-500/20 text-purple-400 border-purple-500/50',
      resource: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
      documentation: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50',
      design: 'bg-pink-500/20 text-pink-400 border-pink-500/50',
      development: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50',
      testing: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
      deployment: 'bg-red-500/20 text-red-400 border-red-500/50',
      general: 'bg-gray-500/20 text-gray-400 border-gray-500/50'
    };
    return colors[category] || colors.general;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <LinkIcon className="w-5 h-5" />
          Project Links
        </h3>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Link
        </Button>
      </div>

      {/* Links List */}
      {loading ? (
        <div className="text-center py-8 text-gray-400">Loading links...</div>
      ) : links.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <LinkIcon className="w-12 h-12 mx-auto mb-4 text-gray-600" />
          <p>No links added yet</p>
          <p className="text-sm text-gray-500 mt-1">Add useful links, resources, and references for this project</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {links.map((link) => (
            <Card key={link.id} className="border-gray-700" style={{ backgroundColor: '#141414' }}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-white truncate">{link.title}</h4>
                      <Badge variant="outline" className={`text-xs ${getCategoryColor(link.category)}`}>
                        {link.category}
                      </Badge>
                    </div>
                    
                    {link.description && (
                      <p className="text-gray-300 text-sm mb-3">{link.description}</p>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span>Added by {link.user?.name || link.user?.email || 'Unknown'}</span>
                      <span>{new Date(link.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(link.url, '_blank')}
                      className="border-gray-600 text-gray-400 hover:text-white"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    
                    {link.created_by === user?.id && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditModal(link)}
                          className="border-gray-600 text-gray-400 hover:text-white"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-gray-600 text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent style={{ backgroundColor: '#141414' }}>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Link</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{link.title}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteLink(link.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Link Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent style={{ backgroundColor: '#141414' }}>
          <DialogHeader>
            <DialogTitle>Add Project Link</DialogTitle>
            <DialogDescription>
              Add a useful link, resource, or reference for this project.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-white">Title *</label>
              <Input
                placeholder="Enter link title"
                value={newLink.title}
                onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
                className="border-gray-600 text-white mt-1"
                style={{ backgroundColor: '#141414' }}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-white">URL *</label>
              <Input
                placeholder="https://example.com"
                value={newLink.url}
                onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                className="border-gray-600 text-white mt-1"
                style={{ backgroundColor: '#141414' }}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-white">Category</label>
              <Select value={newLink.category} onValueChange={(value) => setNewLink({ ...newLink, category: value })}>
                <SelectTrigger className="border-gray-600 text-white mt-1" style={{ backgroundColor: '#141414' }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LINK_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-white">Description (Optional)</label>
              <Textarea
                placeholder="Brief description of this link"
                value={newLink.description}
                onChange={(e) => setNewLink({ ...newLink, description: e.target.value })}
                className="border-gray-600 text-white mt-1"
                style={{ backgroundColor: '#141414' }}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddLink} className="bg-blue-600 hover:bg-blue-700">
              Add Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Link Modal */}
      <Dialog open={!!editingLink} onOpenChange={() => setEditingLink(null)}>
        <DialogContent style={{ backgroundColor: '#141414' }}>
          <DialogHeader>
            <DialogTitle>Edit Project Link</DialogTitle>
            <DialogDescription>
              Update the link information.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-white">Title *</label>
              <Input
                placeholder="Enter link title"
                value={editingLink?.title || ''}
                onChange={(e) => setEditingLink(editingLink ? { ...editingLink, title: e.target.value } : null)}
                className="border-gray-600 text-white mt-1"
                style={{ backgroundColor: '#141414' }}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-white">URL *</label>
              <Input
                placeholder="https://example.com"
                value={editingLink?.url || ''}
                onChange={(e) => setEditingLink(editingLink ? { ...editingLink, url: e.target.value } : null)}
                className="border-gray-600 text-white mt-1"
                style={{ backgroundColor: '#141414' }}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-white">Category</label>
              <Select 
                value={editingLink?.category || 'general'} 
                onValueChange={(value) => setEditingLink(editingLink ? { ...editingLink, category: value } : null)}
              >
                <SelectTrigger className="border-gray-600 text-white mt-1" style={{ backgroundColor: '#141414' }}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LINK_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium text-white">Description (Optional)</label>
              <Textarea
                placeholder="Brief description of this link"
                value={editingLink?.description || ''}
                onChange={(e) => setEditingLink(editingLink ? { ...editingLink, description: e.target.value } : null)}
                className="border-gray-600 text-white mt-1"
                style={{ backgroundColor: '#141414' }}
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={closeEditModal}>
              Cancel
            </Button>
            <Button onClick={handleEditLink} className="bg-green-600 hover:bg-green-700">
              Update Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

