-- Add funding-related columns to projects table
ALTER TABLE projects
ADD COLUMN funding_goal numeric(10,2) DEFAULT 0,
ADD COLUMN current_funding numeric(10,2) DEFAULT 0,
ADD COLUMN accepts_donations boolean DEFAULT false;

-- Add policy to allow public to read funding information
CREATE POLICY "Public can view funding information"
ON projects
FOR SELECT
USING (
  visibility = 'public' OR
  auth.uid() IN (
    SELECT user_id FROM team_members WHERE project_id = projects.id
  ) OR
  auth.uid() = owner_id OR
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.role = 'admin'
  )
);

-- Add policy to allow project owners and admins to update funding information
CREATE POLICY "Project owners and admins can update funding"
ON projects
FOR UPDATE
USING (
  auth.uid() = owner_id OR
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.role = 'admin'
  )
)
WITH CHECK (
  auth.uid() = owner_id OR
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND auth.users.role = 'admin'
  )
); 