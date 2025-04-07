-- Enable RLS on projects table
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Partners can view their own projects" ON projects;
DROP POLICY IF EXISTS "Partners can manage their own projects" ON projects;
DROP POLICY IF EXISTS "Admins can view all projects" ON projects;
DROP POLICY IF EXISTS "Admins can manage all projects" ON projects;
DROP POLICY IF EXISTS "Public can view public projects" ON projects;

-- Create policies for partners
CREATE POLICY "Partners can view their own projects"
    ON projects FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'partner'
            AND projects.created_by = auth.uid()
        )
    );

CREATE POLICY "Partners can manage their own projects"
    ON projects FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'partner'
            AND projects.created_by = auth.uid()
        )
    );

-- Create policies for admins
CREATE POLICY "Admins can view all projects"
    ON projects FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can manage all projects"
    ON projects FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- Create policy for public access
CREATE POLICY "Public can view public projects"
    ON projects FOR SELECT
    TO public
    USING (visibility = 'public'); 