-- Add missing columns to project_open_roles table
ALTER TABLE project_open_roles 
ADD COLUMN IF NOT EXISTS requirements TEXT;

-- Add comment to explain the requirements column
COMMENT ON COLUMN project_open_roles.requirements IS 'Requirements for the role'; 