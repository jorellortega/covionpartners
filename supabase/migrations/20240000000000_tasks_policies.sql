-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create policy to allow project team members to view tasks
CREATE POLICY "Tasks are viewable by project team members" ON tasks
FOR SELECT
USING (
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

-- Create policy to allow project team members to create tasks
CREATE POLICY "Tasks are insertable by project team members" ON tasks
FOR INSERT
WITH CHECK (
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

-- Create policy to allow project team members to update tasks
CREATE POLICY "Tasks are updatable by project team members" ON tasks
FOR UPDATE
USING (
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
)
WITH CHECK (
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

-- Create policy to allow project team members to delete tasks
CREATE POLICY "Tasks are deletable by project team members" ON tasks
FOR DELETE
USING (
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