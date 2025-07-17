'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link as LinkIcon, Plus, Target } from 'lucide-react';
import Link from 'next/link';
import LinkEntityModal from './LinkEntityModal';

interface LinkedEntitiesCardProps {
  timelineId: string;
  projectId: string;
  linkedEntities: any[];
  referencingTimelineItems: any[];
  onRefresh: () => void;
}

export default function LinkedEntitiesCard({ 
  timelineId, 
  projectId,
  linkedEntities, 
  referencingTimelineItems, 
  onRefresh 
}: LinkedEntitiesCardProps) {
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);

  const handleUnlinkEntity = async (entityId: string, entityType: string) => {
    try {
      const response = await fetch('/api/entity-links/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source_entity_type: 'timeline',
          source_entity_id: timelineId,
          target_entity_type: entityType,
          target_entity_id: entityId,
        }),
      });
      
      if (!response.ok) {
        console.error('Error unlinking entity:', response.statusText);
        return;
      }

      // Refresh the linked entities
      onRefresh();
    } catch (error) {
      console.error('Error unlinking entity:', error);
    }
  };

  return (
    <>
      <Card className="leonardo-card border-gray-800 bg-gradient-to-br from-blue-900/30 to-gray-900/60 shadow-xl">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <LinkIcon className="w-6 h-6 text-blue-400" />
              Linked Entities ({linkedEntities.length})
            </CardTitle>
            <button 
              onClick={() => setIsLinkModalOpen(true)}
              className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 px-3 py-1 rounded border border-blue-400/30 hover:bg-blue-400/10 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Link Entity
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {linkedEntities.length === 0 ? (
            <div className="text-gray-400 text-center py-8 border border-gray-700 rounded-lg">
              <LinkIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No entities linked to this timeline item</p>
              <p className="text-sm mt-1">Click "Link Entity" to connect tasks, notes, or other project items</p>
            </div>
          ) : (
            <div className="space-y-3">
              {linkedEntities.map((entity) => (
                <div key={entity.id} className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-white mb-1">{entity.title}</h4>
                      {entity.description && (
                        <p className="text-gray-300 text-sm mb-2">{entity.description}</p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <span className="px-2 py-1 rounded bg-gray-700/50 text-gray-300">
                          {entity.type}
                        </span>
                        {entity.status && (
                          <span className={`px-2 py-1 rounded ${
                            entity.status === 'completed' ? 'bg-green-900/50 text-green-300' :
                            entity.status === 'in_progress' ? 'bg-blue-900/50 text-blue-300' :
                            'bg-gray-700/50 text-gray-300'
                          }`}>
                            {entity.status.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link 
                        href={`/${entity.type}/${entity.id}`}
                        className="text-blue-400 hover:text-blue-300 text-sm"
                        onClick={() => console.log('Clicking link to:', `/${entity.type}/${entity.id}`, 'Entity:', entity)}
                      >
                        View {entity.type}
                      </Link>
                      <button 
                        onClick={() => handleUnlinkEntity(entity.id, entity.type)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Unlink
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Referenced By Other Timeline Items Section */}
          {referencingTimelineItems.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Referenced By Other Timeline Items ({referencingTimelineItems.length})
                </h3>
              </div>
              <div className="space-y-3">
                {referencingTimelineItems.map((timelineItem) => (
                  <div key={timelineItem.id} className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-white mb-1">{timelineItem.title}</h4>
                        {timelineItem.description && (
                          <p className="text-gray-300 text-sm mb-2">{timelineItem.description}</p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          <span className={`px-2 py-1 rounded bg-gray-700/50 text-gray-300`}>
                            {timelineItem.type}
                          </span>
                        </div>
                      </div>
                      <Link 
                        href={`/workmode/timeline/${timelineItem.id}`}
                        className="text-blue-400 hover:text-blue-300 text-sm"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <LinkEntityModal 
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        timelineId={timelineId}
        projectId={projectId}
        onEntityLinked={onRefresh}
      />
    </>
  );
} 