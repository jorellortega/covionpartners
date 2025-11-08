-- Add boolean field to control visibility of the Project Access card
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS show_project_access BOOLEAN DEFAULT true;

COMMENT ON COLUMN projects.show_project_access IS 'Controls visibility of the Project Access card';

