'use client';

import { useState, useEffect, use } from 'react';
import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, CheckCircle, Target, Flag, AlertCircle, FileText, X, Clipboard, Eye, Package, Search, MoreHorizontal, ChevronRight, Home, FolderOpen } from 'lucide-react';
import TimelineFilesClient from './TimelineFilesClient';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import StatusUpdate from './StatusUpdate';
import Link from 'next/link';
import { getLinkedEntities } from '@/lib/entity-links';
import LinkedEntitiesCard from './LinkedEntitiesCard';
import ProjectLinks from './ProjectLinks';

export default function TimelineItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [item, setItem] = useState<any>(null);
  const [linkedEntities, setLinkedEntities] = useState<any[]>([]);
  const [referencingTimelineItems, setReferencingTimelineItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<any>(null);

  useEffect(() => {
    fetchTimelineData();
  }, [id]);

  const fetchTimelineData = async () => {
    setLoading(true);
    try {
  // Fetch the timeline item
      const { data: timelineItem } = await supabase
    .from('project_timeline')
    .select('*')
    .eq('id', id)
    .maybeSingle();

      if (!timelineItem) {
        // Handle not found
        return;
      }

      setItem(timelineItem);

      // Fetch project details for navigation
      if (timelineItem.project_id) {
        const { data: projectData } = await supabase
          .from('projects')
          .select('id, name')
          .eq('id', timelineItem.project_id)
          .single();
        setProject(projectData);
      }

      // Debug logging
      console.log('Timeline item:', {
        id: timelineItem.id,
        title: timelineItem.title,
        related_task_ids: timelineItem.related_task_ids,
        has_related_tasks: timelineItem.related_task_ids && timelineItem.related_task_ids.length > 0,
        project_id: timelineItem.project_id
      });

      // Fetch linked entities using the new entity_links table
      const { data: linkedEntitiesData, error: linkedError } = await getLinkedEntities('timeline', timelineItem.id);
      
      console.log('Linked entities for timeline item:', { linkedEntitiesData, error: linkedError });
      
      setLinkedEntities(linkedEntitiesData || []);

      // Fetch timeline items that reference this timeline item as a task
      const { data: referencingItems } = await supabase
        .from('project_timeline')
      .select('*')
        .eq('project_id', timelineItem.project_id)
        .contains('related_task_ids', [id]);
      
      setReferencingTimelineItems(referencingItems?.filter((t) => t.id !== id) || []);
    } catch (error) {
      console.error('Error fetching timeline data:', error);
    } finally {
      setLoading(false);
    }
  };



  if (loading) {
    return <div className="max-w-4xl mx-auto py-8 px-4">Loading...</div>;
  }

  if (!item) {
    return notFound();
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Navigation Bar */}
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link 
              href="/dashboard" 
              className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-800 transition-colors text-gray-300 hover:text-white"
            >
              <Home className="w-4 h-4" />
              <span className="font-medium">Dashboard</span>
            </Link>
            <Link 
              href="/workmode" 
              className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-800 transition-colors text-gray-300 hover:text-white"
            >
              <FolderOpen className="w-4 h-4" />
              <span className="font-medium">Work Mode</span>
            </Link>
            {project && (
              <Link 
                href={`/projects/${project.id}`}
                className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-800 transition-colors text-gray-300 hover:text-white"
              >
                <span className="font-medium">{project.name}</span>
              </Link>
            )}
          </div>
          <div className="text-sm text-gray-500">
            Timeline Item
          </div>
        </div>
      </div>

      <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-blue-900/30 to-gray-900/60 shadow-xl">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3 mb-2">
            {item.type === 'milestone' && <Flag className="w-7 h-7 text-blue-400" />}
            {item.type === 'objective' && <Target className="w-7 h-7 text-green-400" />}
            {item.type === 'task' && <CheckCircle className="w-7 h-7 text-purple-400" />}
            {item.type === 'deadline' && <AlertCircle className="w-7 h-7 text-red-400" />}
            {item.type === 'plan' && <Clipboard className="w-7 h-7 text-yellow-400" />}
            {item.type === 'review' && <Eye className="w-7 h-7 text-orange-400" />}
            {item.type === 'meeting' && <Users className="w-7 h-7 text-cyan-400" />}
            {item.type === 'deliverable' && <Package className="w-7 h-7 text-pink-400" />}
            {item.type === 'research' && <Search className="w-7 h-7 text-indigo-400" />}
            {item.type === 'other' && <MoreHorizontal className="w-7 h-7 text-gray-400" />}
            <CardTitle className="text-2xl font-bold">{item.title}</CardTitle>
            <div className="text-xs text-gray-500 mt-1 opacity-60">
              {item.type}
            </div>
            <div className="flex items-center gap-2">
              {/* Status update dropdown */}
              <StatusUpdate 
                id={item.id} 
                status={item.status} 
                onStatusChange={(newStatus) => {
                  setItem({ ...item, status: newStatus });
                }}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 text-gray-300 text-lg">{item.description}</div>
          <div className="flex items-center gap-4 mb-4">
            <span className="flex items-center gap-1 text-gray-400"><Calendar className="w-4 h-4" />{item.due_date ? new Date(item.due_date).toLocaleDateString() : '--'}</span>
            {item.assignee_name && <span className="flex items-center gap-1 text-gray-400"><Users className="w-4 h-4" />{item.assignee_name}</span>}
          </div>
          <div className="mb-4">
            <span className="text-gray-400">Progress: </span>
            <span className="font-bold text-white">{item.progress}%</span>
            <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
              <div className="bg-blue-500 h-2 rounded-full transition-all duration-300" style={{ width: `${item.progress}%` }}></div>
            </div>
          </div>

          {/* File upload/download section (client component) */}
          <TimelineFilesClient timelineId={item.id} />
        </CardContent>
      </Card>

      {/* Linked Entities Card */}
      <div className="mt-6">
        <LinkedEntitiesCard
          timelineId={item.id}
          projectId={item.project_id}
          linkedEntities={linkedEntities}
          referencingTimelineItems={referencingTimelineItems}
          onRefresh={fetchTimelineData}
        />
      </div>

      {/* Project Links */}
      <div className="mt-6">
        <ProjectLinks projectId={item.project_id} />
      </div>
    </div>
  );
} 