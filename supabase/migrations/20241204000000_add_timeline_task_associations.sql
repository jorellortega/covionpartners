-- Add task associations to timeline items
-- This allows linking tasks from the tasks table to timeline objectives

-- Add related_task_ids column to project_timeline table
ALTER TABLE project_timeline 
ADD COLUMN IF NOT EXISTS related_task_ids UUID[] DEFAULT '{}';

-- Add index for better performance when querying by related tasks
CREATE INDEX IF NOT EXISTS idx_project_timeline_related_task_ids 
ON project_timeline USING GIN (related_task_ids);

-- Add comment to explain the column
COMMENT ON COLUMN project_timeline.related_task_ids IS 'Array of task IDs that are associated with this timeline item (objective/milestone)';

-- Create a function to add a task to a timeline item
CREATE OR REPLACE FUNCTION add_task_to_timeline(timeline_id UUID, task_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE project_timeline 
  SET related_task_ids = array_append(related_task_ids, task_id)
  WHERE id = timeline_id;
END;
$$ LANGUAGE plpgsql;

-- Create a function to remove a task from a timeline item
CREATE OR REPLACE FUNCTION remove_task_from_timeline(timeline_id UUID, task_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE project_timeline 
  SET related_task_ids = array_remove(related_task_ids, task_id)
  WHERE id = timeline_id;
END;
$$ LANGUAGE plpgsql; 