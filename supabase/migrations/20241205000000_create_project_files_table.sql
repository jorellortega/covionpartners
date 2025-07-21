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

-- Create timeline_files table for storing timeline-specific files
CREATE TABLE IF NOT EXISTS timeline_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timeline_id UUID NOT NULL REFERENCES project_timeline(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_url VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_project_files_project_id ON project_files(project_id);
CREATE INDEX idx_project_files_user_id ON project_files(user_id);
CREATE INDEX idx_project_files_created_at ON project_files(created_at);
CREATE INDEX idx_timeline_files_timeline_id ON timeline_files(timeline_id);
CREATE INDEX idx_timeline_files_project_id ON timeline_files(project_id);
CREATE INDEX idx_timeline_files_user_id ON timeline_files(user_id);

-- Enable Row Level Security
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_files ENABLE ROW LEVEL SECURITY;

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

-- Create RLS policies for timeline_files
CREATE POLICY "Timeline files are viewable by project team members" ON timeline_files
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.project_id = timeline_files.project_id
    AND tm.user_id = auth.uid()
    AND tm.status = 'active'
  )
  OR 
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = timeline_files.project_id
    AND p.owner_id = auth.uid()
  )
);

CREATE POLICY "Timeline files are insertable by project team members" ON timeline_files
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.project_id = timeline_files.project_id
    AND tm.user_id = auth.uid()
    AND tm.status = 'active'
  )
  OR 
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = timeline_files.project_id
    AND p.owner_id = auth.uid()
  )
);

CREATE POLICY "Timeline files are updatable by project team members" ON timeline_files
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.project_id = timeline_files.project_id
    AND tm.user_id = auth.uid()
    AND tm.status = 'active'
  )
  OR 
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = timeline_files.project_id
    AND p.owner_id = auth.uid()
  )
);

CREATE POLICY "Timeline files are deletable by project team members" ON timeline_files
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.project_id = timeline_files.project_id
    AND tm.user_id = auth.uid()
    AND tm.status = 'active'
  )
  OR 
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = timeline_files.project_id
    AND p.owner_id = auth.uid()
  )
);

-- Add trigger to update updated_at timestamp for project_files
CREATE TRIGGER update_project_files_updated_at
    BEFORE UPDATE ON project_files
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 