-- Enable RLS on updates table
ALTER TABLE updates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Updates are viewable by authenticated users" ON updates;
DROP POLICY IF EXISTS "Updates can be created by service role" ON updates;
DROP POLICY IF EXISTS "Updates can be updated by service role" ON updates;
DROP POLICY IF EXISTS "Updates are viewable by everyone" ON updates;
DROP POLICY IF EXISTS "Partners and admins can create updates" ON updates;
DROP POLICY IF EXISTS "Partners and admins can update updates" ON updates;
DROP POLICY IF EXISTS "Partners and admins can delete updates" ON updates;

-- Create new policies
CREATE POLICY "Updates are viewable by authenticated users"
    ON updates FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Updates can be created by partners and admins"
    ON updates FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('partner', 'admin')
        )
    );

CREATE POLICY "Updates can be updated by partners and admins"
    ON updates FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('partner', 'admin')
        )
    );

CREATE POLICY "Updates can be deleted by partners and admins"
    ON updates FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('partner', 'admin')
        )
    );

-- Allow public access to updates (if needed)
CREATE POLICY "Updates are viewable by everyone"
ON updates
FOR SELECT
TO public
USING (true); 