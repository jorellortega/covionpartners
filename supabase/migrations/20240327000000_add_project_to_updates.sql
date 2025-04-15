-- Create an index on project_id for better query performance
CREATE INDEX IF NOT EXISTS idx_updates_project_id ON updates(project_id);

-- Add RLS policies for updates based on project access
CREATE POLICY "Users can view updates for projects they have access to"
ON updates
FOR SELECT
USING (
  (
    -- User is admin
    auth.role() = 'admin'
  ) OR (
    -- User is the project owner
    project_id IN (
      SELECT id FROM projects WHERE owner_id = auth.uid()
    )
  ) OR (
    -- User is a team member
    project_id IN (
      SELECT project_id FROM team_members WHERE user_id = auth.uid()
    )
  ) OR (
    -- Update has no project_id and user's role is in target_roles
    (project_id IS NULL AND (
      target_roles IS NULL OR 
      auth.role()::text = ANY(target_roles)
    ))
  )
); 