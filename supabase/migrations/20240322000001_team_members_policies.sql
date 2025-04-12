-- First, drop all existing policies
DROP POLICY IF EXISTS "Allow authenticated users full access" ON team_members;
DROP POLICY IF EXISTS "Delete team members" ON team_members;
DROP POLICY IF EXISTS "Insert team members" ON team_members;
DROP POLICY IF EXISTS "Project owners can add team members" ON team_members;
DROP POLICY IF EXISTS "Project owners can remove team members" ON team_members;
DROP POLICY IF EXISTS "Project owners can update team members" ON team_members;
DROP POLICY IF EXISTS "Update team members" ON team_members;
DROP POLICY IF EXISTS "Users can view team members of their projects" ON team_members;
DROP POLICY IF EXISTS "View team members" ON team_members;

-- Enable RLS
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Create a simple SELECT policy
-- Users can see team members if they are:
-- 1. The team member themselves
-- 2. A member of the same project
CREATE POLICY "select_team_members" ON team_members
FOR SELECT TO authenticated
USING (
  user_id = auth.uid() OR
  project_id IN (
    SELECT project_id FROM team_members WHERE user_id = auth.uid()
  )
);

-- Only project owners can insert new team members
CREATE POLICY "insert_team_members" ON team_members
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM team_members 
    WHERE project_id = team_members.project_id 
    AND user_id = auth.uid() 
    AND project_role = 'owner'
  )
);

-- Project owners can update team members in their projects
CREATE POLICY "update_team_members" ON team_members
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM team_members 
    WHERE project_id = team_members.project_id 
    AND user_id = auth.uid() 
    AND project_role = 'owner'
  )
);

-- Project owners can delete team members from their projects
CREATE POLICY "delete_team_members" ON team_members
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM team_members 
    WHERE project_id = team_members.project_id 
    AND user_id = auth.uid() 
    AND project_role = 'owner'
  )
); 