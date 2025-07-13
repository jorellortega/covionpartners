import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, CheckCircle, Target, Flag, AlertCircle } from 'lucide-react';
import TimelineFilesClient from './TimelineFilesClient';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import StatusUpdate from './StatusUpdate';

export default async function TimelineItemPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { data: item } = await supabase
    .from('project_timeline')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (!item) return notFound();

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-blue-900/30 to-gray-900/60 shadow-xl">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3 mb-2">
            {item.type === 'milestone' && <Flag className="w-7 h-7 text-blue-400" />}
            {item.type === 'objective' && <Target className="w-7 h-7 text-blue-400" />}
            {item.type === 'task' && <CheckCircle className="w-7 h-7 text-blue-400" />}
            {item.type === 'deadline' && <AlertCircle className="w-7 h-7 text-blue-400" />}
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
          {/* File upload/download section (client component) */}
          <TimelineFilesClient timelineId={item.id} />
        </CardContent>
      </Card>
    </div>
  );
} 