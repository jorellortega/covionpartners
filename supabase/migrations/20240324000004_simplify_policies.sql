-- Enable RLS on projects table
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Enable access for authenticated users" ON projects;
DROP POLICY IF EXISTS "Partners can create projects" ON projects;
DROP POLICY IF EXISTS "Admins can manage all projects" ON projects;
DROP POLICY IF EXISTS "Partners can create and manage their own projects" ON projects;

-- Create a simple permissive policy for authenticated users
CREATE POLICY "Enable access for authenticated users"
    ON projects FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create a simple policy for users table
CREATE POLICY "Enable read access to users"
    ON users FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    TO authenticated
    USING (auth.uid() = id); 