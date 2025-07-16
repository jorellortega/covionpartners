-- Add actions_enabled field to projects table
ALTER TABLE projects 
ADD COLUMN actions_enabled BOOLEAN DEFAULT false;

-- Update existing records to set actions_enabled to false
UPDATE projects 
SET actions_enabled = false 
WHERE actions_enabled IS NULL OR actions_enabled = true;

-- Update trigger to handle the new field
COMMENT ON COLUMN projects.actions_enabled IS 'Controls visibility of the Actions card on public project pages'; 