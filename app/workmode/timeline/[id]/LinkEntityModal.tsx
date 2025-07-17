'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { createEntityLink } from '@/lib/entity-links';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  FileText, 
  StickyNote,
  File, 
  Search, 
  Plus, 
  X,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface LinkEntityModalProps {
  isOpen: boolean;
  onClose: () => void;
  timelineId: string;
  projectId: string;
  onEntityLinked: () => void;
}

interface ProjectEntity {
  id: string;
  title: string;
  description?: string;
  status?: string;
  type: string;
  created_at: string;
}

export default function LinkEntityModal({ 
  isOpen, 
  onClose, 
  timelineId, 
  projectId, 
  onEntityLinked 
}: LinkEntityModalProps) {
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntities, setSelectedEntities] = useState<string[]>([]);
  const [projectEntities, setProjectEntities] = useState<{
    tasks: ProjectEntity[];
    notes: ProjectEntity[];
    files: ProjectEntity[];
  }>({ tasks: [], notes: [], files: [] });
  const { toast } = useToast();

  // Fetch all project entities when modal opens
  useEffect(() => {
    if (isOpen && projectId) {
      fetchProjectEntities();
    }
  }, [isOpen, projectId]);

  const fetchProjectEntities = async () => {
    setLoading(true);
    try {
      // Fetch tasks
      const { data: tasks } = await supabase
        .from('tasks')
        .select('id, title, description, status, created_at')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      // Fetch notes - get business_notes from the same organization as the project
      let notes: any[] = [];
      if (projectId) {
        // First get the project to find its organization_id
        const { data: project, error: projectError } = await supabase
          .from('projects')
          .select('organization_id')
          .eq('id', projectId)
          .single();

        console.log('Project for notes:', project, 'Error:', projectError);

        if (project?.organization_id) {
          const { data: businessNotes, error: notesError } = await supabase
            .from('business_notes')
            .select('id, title, content, created_at')
            .eq('organization_id', project.organization_id)
            .order('created_at', { ascending: false });
          
          console.log('Business notes:', businessNotes, 'Error:', notesError);
          notes = businessNotes || [];
        }
      }

      console.log('Final notes array:', notes);

      // Fetch files - get project files and timeline files for this project
      let files: any[] = [];
      
      // Fetch from project_files table
      const { data: projectFiles, error: projectFilesError } = await supabase
        .from('project_files')
        .select('id, name, type, created_at')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      
      console.log('Project files:', projectFiles, 'Error:', projectFilesError);
      console.log('Sample project file:', projectFiles?.[0]);
      
      // Fetch from timeline_files table
      const { data: timelineFiles, error: timelineFilesError } = await supabase
        .from('timeline_files')
        .select('*')
        .eq('project_id', projectId)
        .order('uploaded_at', { ascending: false });
      
      console.log('Timeline files:', timelineFiles, 'Error:', timelineFilesError);
      console.log('Timeline files length:', timelineFiles?.length);
      console.log('Sample timeline file:', timelineFiles?.[0]);
      console.log('All timeline files:', timelineFiles);
      
      // Combine both file types
      const pfMapped = (projectFiles || []).map(f => ({
        id: f.id,
        title: f.name,
        description: f.type,
        type: 'file',
        created_at: f.created_at
      }));
      
      const tfMapped = (timelineFiles || []).map(f => ({
        id: f.id,
        title: f.file_name,
        description: 'timeline file',
        type: 'file',
        created_at: f.uploaded_at
      }));
      
      files = [...pfMapped, ...tfMapped];
      console.log('Final files array:', files);
      console.log('Sample mapped file:', files?.[0]);
      console.log('Files array length:', files.length);
      console.log('All mapped files:', files);

      setProjectEntities({
        tasks: tasks?.map(task => ({ 
          id: task.id, 
          title: task.title, 
          description: task.description, 
          status: task.status, 
          type: 'task',
          created_at: task.created_at 
        })) || [],
        notes: notes?.map(note => ({ 
          id: note.id, 
          title: note.title, 
          description: note.content, 
          type: 'note',
          created_at: note.created_at 
        })) || [],
        files: files || []
      });

      console.log('After setProjectEntities - files:', projectEntities.files);
      console.log('After setProjectEntities - sample file:', projectEntities.files?.[0]);
    } catch (error) {
      console.error('Error fetching project entities:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch project entities',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEntityToggle = (entityId: string) => {
    setSelectedEntities(prev => 
      prev.includes(entityId) 
        ? prev.filter(id => id !== entityId)
        : [...prev, entityId]
    );
  };

  const handleLinkEntities = async () => {
    if (selectedEntities.length === 0) {
      toast({
        title: 'No entities selected',
        description: 'Please select at least one entity to link',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      // Find the selected entities and their types
      const allEntities = [
        ...projectEntities.tasks,
        ...projectEntities.notes,
        ...projectEntities.files
      ];
      
      const entitiesToLink = allEntities.filter(entity => 
        selectedEntities.includes(entity.id)
      );

      // Create links for each selected entity
      for (const entity of entitiesToLink) {
        // Check if link already exists
        const { data: existingLink } = await supabase
          .from('entity_links')
          .select('id')
          .eq('source_entity_type', 'timeline')
          .eq('source_entity_id', timelineId)
          .eq('target_entity_type', entity.type)
          .eq('target_entity_id', entity.id)
          .single();

        if (existingLink) {
          console.log(`Link already exists for ${entity.type} ${entity.id}`);
          continue;
        }

        const { error } = await createEntityLink(
          'timeline',
          timelineId,
          entity.type as any,
          entity.id,
          'association',
          projectId
        );

        if (error) {
          console.error(`Error linking ${entity.type} ${entity.id}:`, error);
        }
      }

      toast({
        title: 'Success',
        description: `Linked ${entitiesToLink.length} entity(ies) to timeline`,
      });

      // Reset and close
      setSelectedEntities([]);
      onEntityLinked();
      onClose();
    } catch (error) {
      console.error('Error linking entities:', error);
      toast({
        title: 'Error',
        description: 'Failed to link entities',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-blue-400" />;
      case 'pending':
        return <AlertCircle className="w-4 h-4 text-yellow-400" />;
      default:
        return null;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'task':
        return <FileText className="w-4 h-4" />;
      case 'note':
        return <StickyNote className="w-4 h-4" />;
      case 'file':
        return <File className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const filterEntities = (entities: ProjectEntity[]) => {
    if (!searchTerm) return entities;
    return entities.filter(entity =>
      entity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entity.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Link Project Entities
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col h-full">
          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search entities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Entity Tabs */}
          <Tabs defaultValue="tasks" className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="tasks" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Tasks ({filterEntities(projectEntities.tasks).length})
              </TabsTrigger>
              <TabsTrigger value="notes" className="flex items-center gap-2">
                <StickyNote className="w-4 h-4" />
                Notes ({filterEntities(projectEntities.notes).length})
              </TabsTrigger>
              <TabsTrigger value="files" className="flex items-center gap-2">
                <File className="w-4 h-4" />
                Files ({filterEntities(projectEntities.files).length})
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto mt-4">
              <TabsContent value="tasks" className="space-y-2">
                {loading ? (
                  <div className="text-center py-8 text-gray-400">Loading tasks...</div>
                ) : filterEntities(projectEntities.tasks).length === 0 ? (
                  <div className="text-center py-8 text-gray-400">No tasks found</div>
                ) : (
                  filterEntities(projectEntities.tasks).map((task) => (
                    <Card key={task.id} className="hover:bg-gray-800/50 transition-colors">
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={selectedEntities.includes(task.id)}
                            onCheckedChange={() => handleEntityToggle(task.id)}
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {getTypeIcon(task.type)}
                              <h4 className="font-medium text-white">{task.title}</h4>
                              {getStatusIcon(task.status)}
                              {task.status && (
                                <Badge variant="secondary" className="text-xs">
                                  {task.status.replace('_', ' ')}
                                </Badge>
                              )}
                            </div>
                            {task.description && (
                              <p className="text-gray-300 text-sm">{task.description}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="notes" className="space-y-2">
                {loading ? (
                  <div className="text-center py-8 text-gray-400">Loading notes...</div>
                ) : filterEntities(projectEntities.notes).length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <StickyNote className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No notes found</p>
                    <p className="text-sm mt-1 text-gray-500">Notes functionality needs to be implemented based on organization/project relationship</p>
                  </div>
                ) : (
                  filterEntities(projectEntities.notes).map((note) => (
                    <Card key={note.id} className="hover:bg-gray-800/50 transition-colors">
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={selectedEntities.includes(note.id)}
                            onCheckedChange={() => handleEntityToggle(note.id)}
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {getTypeIcon(note.type)}
                              <h4 className="font-medium text-white">{note.title}</h4>
                            </div>
                            {note.description && (
                              <p className="text-gray-300 text-sm">{note.description}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="files" className="space-y-2">
                {loading ? (
                  <div className="text-center py-8 text-gray-400">Loading files...</div>
                ) : filterEntities(projectEntities.files).length === 0 ? (
                  <div className="text-center py-8 text-gray-400">No files found</div>
                ) : (
                  filterEntities(projectEntities.files).map((file) => (
                    <Card key={file.id} className="hover:bg-gray-800/50 transition-colors">
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={selectedEntities.includes(file.id)}
                            onCheckedChange={() => handleEntityToggle(file.id)}
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {getTypeIcon(file.type)}
                              <h4 className="font-medium text-white">{file.title}</h4>
                            </div>
                            {file.description && (
                              <p className="text-gray-300 text-sm">{file.description}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <DialogFooter className="flex items-center justify-between">
          <div className="text-sm text-gray-400">
            {selectedEntities.length} entity(ies) selected
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleLinkEntities} 
              disabled={loading || selectedEntities.length === 0}
            >
              {loading ? 'Linking...' : `Link ${selectedEntities.length} Entity(ies)`}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 