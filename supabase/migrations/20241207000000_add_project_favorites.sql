-- Add is_favorite column to projects table
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;

-- Create index for better query performance when filtering by favorites
CREATE INDEX IF NOT EXISTS idx_projects_is_favorite ON projects(is_favorite);

-- Add comment to document the new column
COMMENT ON COLUMN projects.is_favorite IS 'Indicates if the project is marked as favorite by the user for priority display'; 