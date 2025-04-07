-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Users can create their own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON projects;
DROP POLICY IF EXISTS "Users can view their own projects" ON projects;
DROP POLICY IF EXISTS "Enable read access to all authenticated users" ON projects;
DROP POLICY IF EXISTS "Partners can create projects" ON projects;
DROP POLICY IF EXISTS "Partners can update their own projects" ON projects;
DROP POLICY IF EXISTS "Partners can delete their own projects" ON projects;
DROP POLICY IF EXISTS "Admins can manage all projects" ON projects;
DROP POLICY IF EXISTS "Partners can view their own projects" ON projects;
DROP POLICY IF EXISTS "Admins can view all projects" ON projects;
DROP POLICY IF EXISTS "Admins can create projects" ON projects;
DROP POLICY IF EXISTS "Admins can update any project" ON projects;
DROP POLICY IF EXISTS "Admins can delete any project" ON projects;

-- Create basic policy for authenticated users
CREATE POLICY "Enable read access to all authenticated users"
    ON projects FOR SELECT
    TO authenticated
    USING (true);

-- Create new policies for partners
CREATE POLICY "Partners can create projects"
    ON projects FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'partner'
        )
    );

CREATE POLICY "Partners can update their own projects"
    ON projects FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'partner'
            AND projects.owner_id = auth.uid()
        )
    );

CREATE POLICY "Partners can delete their own projects"
    ON projects FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'partner'
            AND projects.owner_id = auth.uid()
        )
    );

-- Create policies for admins
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