import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, CheckCircle, Target, Flag, AlertCircle, FileText, Plus, X, Clipboard, Eye, Package, Search, MoreHorizontal } from 'lucide-react';
import TimelineFilesClient from './TimelineFilesClient';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import StatusUpdate from './StatusUpdate';
import Link from 'next/link';

export default async function TimelineItemPage({ params }: { params: { id: string } }) {
  const { id } = params;
  
  // Fetch the timeline item
  const { data: item } = await supabase
    .from('project_timeline')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (!item) return notFound();

  // Fetch associated tasks if this timeline item has related_task_ids
  let associatedTasks: any[] = [];
  if (item.related_task_ids && item.related_task_ids.length > 0) {
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .in('id', item.related_task_ids)
      .order('created_at', { ascending: false });
    
    associatedTasks = tasks || [];
  }

  // Fetch all available tasks for this project (for adding new associations)
  const { data: allProjectTasks } = await supabase
    .from('tasks')
    .select('id, title, description, status, priority')
    .eq('project_id', item.project_id)
    .order('created_at', { ascending: false });

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
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
            <div className="flex items-center gap-2">
              <Badge className="ml-2 bg-blue-700/80 text-white text-base">{item.status?.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</Badge>
              {/* Status update dropdown */}
              <StatusUpdate id={item.id} status={item.status} />
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

          {/* Associated Tasks Section */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Associated Tasks ({associatedTasks.length})
              </h3>
              <Link 
                href={`/workmode?project=${item.project_id}&tab=tasks`}
                className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Manage Tasks
              </Link>
            </div>
            
            {associatedTasks.length === 0 ? (
              <div className="text-gray-400 text-center py-8 border border-gray-700 rounded-lg">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No tasks associated with this {item.type}</p>
                <p className="text-sm mt-1">Tasks can be linked from the Tasks tab</p>
              </div>
            ) : (
              <div className="space-y-3">
                {associatedTasks.map((task) => (
                  <div key={task.id} className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-white mb-1">{task.title}</h4>
                        {task.description && (
                          <p className="text-gray-300 text-sm mb-2">{task.description}</p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          <span className={`px-2 py-1 rounded ${
                            task.status === 'completed' ? 'bg-green-900/50 text-green-300' :
                            task.status === 'in_progress' ? 'bg-blue-900/50 text-blue-300' :
                            'bg-gray-700/50 text-gray-300'
                          }`}>
                            {task.status?.replace('_', ' ')}
                          </span>
                          {task.priority && (
                            <span className={`px-2 py-1 rounded ${
                              task.priority === 'high' ? 'bg-red-900/50 text-red-300' :
                              task.priority === 'medium' ? 'bg-yellow-900/50 text-yellow-300' :
                              'bg-green-900/50 text-green-300'
                            }`}>
                              {task.priority}
                            </span>
                          )}
                        </div>
                      </div>
                      <Link 
                        href={`/workmode?project=${item.project_id}&tab=tasks`}
                        className="text-blue-400 hover:text-blue-300 text-sm"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* File upload/download section (client component) */}
          <TimelineFilesClient timelineId={item.id} />
        </CardContent>
      </Card>
    </div>
  );
} 