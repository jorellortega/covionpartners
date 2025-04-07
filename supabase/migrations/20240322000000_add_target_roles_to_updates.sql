-- Update RLS policies to consider target_roles
DROP POLICY IF EXISTS "Updates are viewable by authenticated users" ON updates;
DROP POLICY IF EXISTS "Updates are viewable by everyone" ON updates;

-- Create new policies that consider target_roles
CREATE POLICY "Updates are viewable by authenticated users"
ON updates FOR SELECT
TO authenticated
USING (
  target_roles IS NULL OR 
  target_roles @> ARRAY[auth.jwt()->>'role']::text[]
);

CREATE POLICY "Updates are viewable by everyone"
ON updates FOR SELECT
TO public
USING (target_roles IS NULL);

-- Update existing updates to have NULL target_roles (making them visible to all)
UPDATE updates SET target_roles = NULL; 