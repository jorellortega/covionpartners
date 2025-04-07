-- First, verify the current policies
SELECT * FROM pg_policies WHERE tablename = 'updates';

-- Drop all existing policies
DROP POLICY IF EXISTS "Updates are viewable by authenticated users" ON updates;
DROP POLICY IF EXISTS "Updates can be created by partners and admins" ON updates;
DROP POLICY IF EXISTS "Updates can be updated by partners and admins" ON updates;
DROP POLICY IF EXISTS "Updates can be deleted by partners and admins" ON updates;
DROP POLICY IF EXISTS "Updates are viewable by everyone" ON updates;
DROP POLICY IF EXISTS "Partners and admins can create updates" ON updates;
DROP POLICY IF EXISTS "Partners and admins can update updates" ON updates;
DROP POLICY IF EXISTS "Partners and admins can delete updates" ON updates;
DROP POLICY IF EXISTS "Updates are viewable by public" ON updates;

-- Create new policies with correct role checking
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
    )
    WITH CHECK (
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

-- Allow public access to view updates
CREATE POLICY "Updates are viewable by everyone"
    ON updates FOR SELECT
    TO public
    USING (true); 