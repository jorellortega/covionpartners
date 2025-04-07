-- Drop existing policy
DROP POLICY IF EXISTS "Enable access for authenticated users" ON projects;

-- Create separate policies for different operations
CREATE POLICY "Enable read for authenticated users"
    ON projects FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert for authenticated users"
    ON projects FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Enable update for project owners"
    ON projects FOR UPDATE
    TO authenticated
    USING (owner_id = auth.uid());

CREATE POLICY "Enable delete for project owners"
    ON projects FOR DELETE
    TO authenticated
    USING (owner_id = auth.uid()); 