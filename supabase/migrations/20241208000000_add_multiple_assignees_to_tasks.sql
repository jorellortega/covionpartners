-- Add support for multiple assignees in tasks table
-- Keep the existing assigned_to column for backward compatibility
-- Add a new assigned_users column to store multiple assignee IDs as JSON array

ALTER TABLE tasks 
ADD COLUMN assigned_users JSONB DEFAULT '[]'::jsonb;

-- Create an index for better query performance
CREATE INDEX idx_tasks_assigned_users ON tasks USING GIN (assigned_users);

-- Add a check constraint to ensure assigned_users is always an array
ALTER TABLE tasks 
ADD CONSTRAINT tasks_assigned_users_array_check 
CHECK (jsonb_typeof(assigned_users) = 'array');

-- Update RLS policies to include assigned_users
-- Users can view tasks if they are assigned to them (either in assigned_to or assigned_users)
CREATE POLICY "Users can view tasks assigned to them" ON tasks
FOR SELECT
USING (
  assigned_to = auth.uid() 
  OR 
  assigned_users ? auth.uid()::text
  OR
  EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.project_id = tasks.project_id
    AND tm.user_id = auth.uid()
    AND tm.status = 'active'
  )
  OR 
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = tasks.project_id
    AND p.owner_id = auth.uid()
  )
);

-- Users can update tasks if they are assigned to them or are project members
CREATE POLICY "Users can update tasks assigned to them" ON tasks
FOR UPDATE
USING (
  assigned_to = auth.uid() 
  OR 
  assigned_users ? auth.uid()::text
  OR
  EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.project_id = tasks.project_id
    AND tm.user_id = auth.uid()
    AND tm.status = 'active'
  )
  OR 
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = tasks.project_id
    AND p.owner_id = auth.uid()
  )
); 