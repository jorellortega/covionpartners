-- Add project column to organization_goals table
ALTER TABLE organization_goals ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

-- Create index for better performance when querying by project
CREATE INDEX IF NOT EXISTS idx_organization_goals_project_id ON organization_goals(project_id);

-- Update the table to ensure all constraints are properly set
ALTER TABLE organization_goals 
  ALTER COLUMN project_id SET DATA TYPE UUID,
  ALTER COLUMN project_id DROP NOT NULL;

-- Grant necessary permissions
GRANT ALL ON organization_goals TO authenticated;
