-- Create work_assignments table for project roles
CREATE TABLE IF NOT EXISTS project_role_work_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role_id UUID REFERENCES project_open_roles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'in_progress', 'completed', 'cancelled')),
  project_title TEXT NOT NULL,
  work_description TEXT,
  deliverables TEXT,
  timeline_days INTEGER,
  payment_terms TEXT,
  milestones TEXT,
  communication_preferences TEXT,
  start_date DATE,
  hourly_rate DECIMAL(10,2),
  total_budget DECIMAL(10,2),
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_project_role_work_assignments_role_id ON project_role_work_assignments(role_id);
CREATE INDEX idx_project_role_work_assignments_user_id ON project_role_work_assignments(user_id);
CREATE INDEX idx_project_role_work_assignments_project_id ON project_role_work_assignments(project_id);
CREATE INDEX idx_project_role_work_assignments_status ON project_role_work_assignments(status);

-- Enable Row Level Security
ALTER TABLE project_role_work_assignments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own work assignments"
  ON project_role_work_assignments FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Project owners can view work assignments for their projects"
  ON project_role_work_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_role_work_assignments.project_id
      AND projects.owner_id = auth.uid()
    )
  );

CREATE POLICY "Project owners can create work assignments"
  ON project_role_work_assignments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_role_work_assignments.project_id
      AND projects.owner_id = auth.uid()
    )
  );

CREATE POLICY "Assigned users can update their work assignments"
  ON project_role_work_assignments FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Project owners can update work assignments for their projects"
  ON project_role_work_assignments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_role_work_assignments.project_id
      AND projects.owner_id = auth.uid()
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_project_role_work_assignments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_project_role_work_assignments_updated_at
  BEFORE UPDATE ON project_role_work_assignments
  FOR EACH ROW EXECUTE FUNCTION update_project_role_work_assignments_updated_at(); 