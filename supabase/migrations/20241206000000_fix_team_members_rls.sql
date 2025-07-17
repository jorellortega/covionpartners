-- Fix circular dependency in team_members RLS policy
-- Drop the problematic policy
DROP POLICY IF EXISTS "select_team_members" ON team_members;

-- Create a new policy that allows users to check their own membership
CREATE POLICY "select_team_members" ON team_members
FOR SELECT TO authenticated
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = team_members.project_id 
    AND projects.owner_id = auth.uid()
  )
);

-- Also fix the insert policy to allow work assignment users to join
DROP POLICY IF EXISTS "insert_team_members" ON team_members;

CREATE POLICY "insert_team_members" ON team_members
FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = team_members.project_id 
    AND projects.owner_id = auth.uid()
  )
); 