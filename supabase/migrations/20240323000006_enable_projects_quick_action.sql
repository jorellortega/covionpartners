-- First, make sure we have all required columns
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS type project_type,
ADD COLUMN IF NOT EXISTS invested numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS roi numeric DEFAULT 0;

-- Create project_type enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_type') THEN
        CREATE TYPE project_type AS ENUM ('Investment', 'Collaboration');
    END IF;
END $$;

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access to all authenticated users" ON projects;
DROP POLICY IF EXISTS "Authenticated users can do all" ON projects;

-- Create simple policy for authenticated users
CREATE POLICY "Enable access for authenticated users"
    ON projects FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Create function to handle project updates
CREATE OR REPLACE FUNCTION handle_project_update()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating updated_at
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION handle_project_update(); 