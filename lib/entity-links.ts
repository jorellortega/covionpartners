import { supabase } from './supabase';

export interface EntityLink {
  id: string;
  source_entity_type: 'task' | 'timeline' | 'project' | 'organization' | 'note' | 'file';
  source_entity_id: string;
  target_entity_type: 'task' | 'timeline' | 'project' | 'organization' | 'note' | 'file';
  target_entity_id: string;
  link_type: string;
  project_id?: string;
  organization_id?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface LinkedEntity {
  id: string;
  title: string;
  type: string;
  description?: string;
  status?: string;
  project_id?: string;
}

/**
 * Create a link between two entities
 */
export async function createEntityLink(
  sourceType: EntityLink['source_entity_type'],
  sourceId: string,
  targetType: EntityLink['target_entity_type'],
  targetId: string,
  linkType: string = 'association',
  projectId?: string,
  organizationId?: string
): Promise<{ data: EntityLink | null; error: any }> {
  const { data, error } = await supabase
    .from('entity_links')
    .insert({
      source_entity_type: sourceType,
      source_entity_id: sourceId,
      target_entity_type: targetType,
      target_entity_id: targetId,
      link_type: linkType,
      project_id: projectId,
      organization_id: organizationId,
    })
    .select()
    .single();

  return { data, error };
}

/**
 * Delete a link between two entities
 */
export async function deleteEntityLink(
  sourceType: EntityLink['source_entity_type'],
  sourceId: string,
  targetType: EntityLink['target_entity_type'],
  targetId: string
): Promise<{ error: any }> {
  const { error } = await supabase
    .from('entity_links')
    .delete()
    .eq('source_entity_type', sourceType)
    .eq('source_entity_id', sourceId)
    .eq('target_entity_type', targetType)
    .eq('target_entity_id', targetId);

  return { error };
}

/**
 * Get all entities linked TO a specific entity
 */
export async function getLinkedEntities(
  entityType: EntityLink['source_entity_type'],
  entityId: string
): Promise<{ data: LinkedEntity[]; error: any }> {
  const { data: links, error: linksError } = await supabase
    .from('entity_links')
    .select('*')
    .eq('source_entity_type', entityType)
    .eq('source_entity_id', entityId);

  if (linksError || !links || links.length === 0) {
    return { data: [], error: linksError };
  }

  // Group links by target entity type
  const timelineLinks = links.filter(link => link.target_entity_type === 'timeline');
  const taskLinks = links.filter(link => link.target_entity_type === 'task');
  const projectLinks = links.filter(link => link.target_entity_type === 'project');

  const linkedEntities: LinkedEntity[] = [];

  // Fetch timeline items
  if (timelineLinks.length > 0) {
    const timelineIds = timelineLinks.map(link => link.target_entity_id);
    const { data: timelineItems } = await supabase
      .from('project_timeline')
      .select('id, title, type, description, status, project_id')
      .in('id', timelineIds);
    
    if (timelineItems) {
      linkedEntities.push(...timelineItems.map(item => ({
        id: item.id,
        title: item.title,
        type: item.type,
        description: item.description,
        status: item.status,
        project_id: item.project_id
      })));
    }
  }

  // Fetch tasks
  if (taskLinks.length > 0) {
    const taskIds = taskLinks.map(link => link.target_entity_id);
    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, title, description, status, project_id')
      .in('id', taskIds);
    
    if (tasks) {
      linkedEntities.push(...tasks.map(task => ({
        id: task.id,
        title: task.title,
        type: 'task',
        description: task.description,
        status: task.status,
        project_id: task.project_id
      })));
    }
  }

  // Fetch projects
  if (projectLinks.length > 0) {
    const projectIds = projectLinks.map(link => link.target_entity_id);
    const { data: projects } = await supabase
      .from('projects')
      .select('id, name, description, status')
      .in('id', projectIds);
    
    if (projects) {
      linkedEntities.push(...projects.map(project => ({
        id: project.id,
        title: project.name,
        type: 'project',
        description: project.description,
        status: project.status
      })));
    }
  }

  return { data: linkedEntities, error: null };
}

/**
 * Get all entities that link TO a specific entity (reverse lookup)
 */
export async function getEntitiesLinkingTo(
  entityType: EntityLink['target_entity_type'],
  entityId: string
): Promise<{ data: LinkedEntity[]; error: any }> {
  const { data: links, error: linksError } = await supabase
    .from('entity_links')
    .select('*')
    .eq('target_entity_type', entityType)
    .eq('target_entity_id', entityId);

  if (linksError || !links || links.length === 0) {
    return { data: [], error: linksError };
  }

  // Group links by source entity type
  const timelineLinks = links.filter(link => link.source_entity_type === 'timeline');
  const taskLinks = links.filter(link => link.source_entity_type === 'task');
  const projectLinks = links.filter(link => link.source_entity_type === 'project');

  const linkedEntities: LinkedEntity[] = [];

  // Fetch timeline items
  if (timelineLinks.length > 0) {
    const timelineIds = timelineLinks.map(link => link.source_entity_id);
    const { data: timelineItems } = await supabase
      .from('project_timeline')
      .select('id, title, type, description, status, project_id')
      .in('id', timelineIds);
    
    if (timelineItems) {
      linkedEntities.push(...timelineItems.map(item => ({
        id: item.id,
        title: item.title,
        type: item.type,
        description: item.description,
        status: item.status,
        project_id: item.project_id
      })));
    }
  }

  // Fetch tasks
  if (taskLinks.length > 0) {
    const taskIds = taskLinks.map(link => link.source_entity_id);
    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, title, description, status, project_id')
      .in('id', taskIds);
    
    if (tasks) {
      linkedEntities.push(...tasks.map(task => ({
        id: task.id,
        title: task.title,
        type: 'task',
        description: task.description,
        status: task.status,
        project_id: task.project_id
      })));
    }
  }

  // Fetch projects
  if (projectLinks.length > 0) {
    const projectIds = projectLinks.map(link => link.source_entity_id);
    const { data: projects } = await supabase
      .from('projects')
      .select('id, name, description, status')
      .in('id', projectIds);
    
    if (projects) {
      linkedEntities.push(...projects.map(project => ({
        id: project.id,
        title: project.name,
        type: 'project',
        description: project.description,
        status: project.status
      })));
    }
  }

  return { data: linkedEntities, error: null };
}

/**
 * Check if two entities are linked
 */
export async function areEntitiesLinked(
  sourceType: EntityLink['source_entity_type'],
  sourceId: string,
  targetType: EntityLink['target_entity_type'],
  targetId: string
): Promise<{ linked: boolean; error: any }> {
  const { data, error } = await supabase
    .from('entity_links')
    .select('id')
    .eq('source_entity_type', sourceType)
    .eq('source_entity_id', sourceId)
    .eq('target_entity_type', targetType)
    .eq('target_entity_id', targetId)
    .single();

  return { linked: !!data, error };
} 