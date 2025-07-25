-- Check if project_files table exists and its structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'project_files' 
ORDER BY ordinal_position;

-- If the table doesn't exist or is missing user_id column, recreate it:
DROP TABLE IF EXISTS project_files CASCADE;

-- Create project_files table for storing project-related files
CREATE TABLE IF NOT EXISTS project_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    storage_name VARCHAR(500) NOT NULL,
    url VARCHAR(1000) NOT NULL,
    type VARCHAR(100),
    size BIGINT,
    team_only BOOLEAN DEFAULT false,
    access_level INTEGER DEFAULT 1,
    custom_label VARCHAR(255),
    label_status VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_project_files_project_id ON project_files(project_id);
CREATE INDEX idx_project_files_user_id ON project_files(user_id);
CREATE INDEX idx_project_files_created_at ON project_files(created_at);

-- Enable Row Level Security
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for project_files
CREATE POLICY "Project files are viewable by project team members" ON project_files
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.project_id = project_files.project_id
    AND tm.user_id = auth.uid()
    AND tm.status = 'active'
  )
  OR 
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_files.project_id
    AND p.owner_id = auth.uid()
  )
);

CREATE POLICY "Project files are insertable by project team members" ON project_files
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.project_id = project_files.project_id
    AND tm.user_id = auth.uid()
    AND tm.status = 'active'
  )
  OR 
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_files.project_id
    AND p.owner_id = auth.uid()
  )
);

CREATE POLICY "Project files are updatable by project team members" ON project_files
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.project_id = project_files.project_id
    AND tm.user_id = auth.uid()
    AND tm.status = 'active'
  )
  OR 
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_files.project_id
    AND p.owner_id = auth.uid()
  )
);

CREATE POLICY "Project files are deletable by project team members" ON project_files
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.project_id = project_files.project_id
    AND tm.user_id = auth.uid()
    AND tm.status = 'active'
  )
  OR 
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_files.project_id
    AND p.owner_id = auth.uid()
  )
);

-- Function to update updated_at timestamp (if it doesn't exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_project_files_updated_at ON project_files;
CREATE TRIGGER update_project_files_updated_at
    BEFORE UPDATE ON project_files
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verify the table was created correctly
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'project_files' 
ORDER BY ordinal_position; 