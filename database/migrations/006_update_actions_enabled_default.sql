-- Update actions_enabled column default to false and update existing records
-- This migration handles the case where the column already exists

-- Update existing records to set actions_enabled to false
UPDATE projects 
SET actions_enabled = false 
WHERE actions_enabled = true;

-- Update the column default for future records
ALTER TABLE projects 
ALTER COLUMN actions_enabled SET DEFAULT false;

COMMENT ON COLUMN projects.actions_enabled IS 'Controls visibility of the Actions card on public project pages (defaults to false for security)'; 