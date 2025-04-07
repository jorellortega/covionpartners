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

-- Create temporary permissive policies for authenticated users
CREATE POLICY "Authenticated users can do all"
    ON projects FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Insert your user into the users table if not exists
INSERT INTO users (id, role)
SELECT 
    auth.uid(),
    'partner'
FROM auth.users
WHERE auth.uid() IS NOT NULL
ON CONFLICT (id) DO UPDATE
SET role = 'partner'; 