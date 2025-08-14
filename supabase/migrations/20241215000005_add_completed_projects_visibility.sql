-- Add visibility field to projects table for individual project visibility
ALTER TABLE projects 
ADD COLUMN profile_visible BOOLEAN DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN projects.profile_visible IS 'Controls whether this project is visible on the owner profile page';
