-- Create table for project file submissions
CREATE TABLE IF NOT EXISTS project_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  submission_type VARCHAR(50) DEFAULT 'submission' CHECK (submission_type IN ('submission', 'document', 'resource')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_project_submissions_project_id ON project_submissions(project_id);
CREATE INDEX IF NOT EXISTS idx_project_submissions_user_id ON project_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_project_submissions_task_id ON project_submissions(task_id);
CREATE INDEX IF NOT EXISTS idx_project_submissions_created_at ON project_submissions(created_at);

-- Enable RLS
ALTER TABLE project_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view submissions for projects they're members of" ON project_submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.project_id = project_submissions.project_id
      AND tm.user_id = auth.uid()
      AND tm.status = 'active'
    )
    OR
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_submissions.project_id
      AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create submissions for projects they're members of" ON project_submissions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.project_id = project_submissions.project_id
      AND tm.user_id = auth.uid()
      AND tm.status = 'active'
    )
    OR
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_submissions.project_id
      AND p.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own submissions" ON project_submissions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own submissions or project owners can delete any" ON project_submissions
  FOR DELETE USING (
    auth.uid() = user_id
    OR
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_submissions.project_id
      AND p.owner_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_project_submissions_updated_at
  BEFORE UPDATE ON project_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 