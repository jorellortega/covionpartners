-- Enable RLS on projects table
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Enable access for authenticated users" ON projects;
DROP POLICY IF EXISTS "Partners can create projects" ON projects;
DROP POLICY IF EXISTS "Admins can manage all projects" ON projects;

-- Create policy for partners to create and manage their own projects
CREATE POLICY "Partners can create and manage their own projects"
    ON projects FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'partner'
            AND projects.owner_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'partner'
            AND projects.owner_id = auth.uid()
        )
    );

-- Create policy for admins to manage all projects
CREATE POLICY "Admins can manage all projects"
    ON projects FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Create policy for viewing projects
CREATE POLICY "Enable read access to all authenticated users"
    ON projects FOR SELECT
    TO authenticated
    USING (true); 