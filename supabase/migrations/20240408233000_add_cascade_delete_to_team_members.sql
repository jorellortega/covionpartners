-- Add ON DELETE CASCADE to team_members foreign key referencing projects

BEGIN;

-- Attempt to drop the existing foreign key constraint (name might vary)
-- If this fails because the constraint name is different or doesn't exist, it's okay.
ALTER TABLE public.team_members
DROP CONSTRAINT IF EXISTS team_members_project_id_fkey;

-- Add the foreign key constraint with ON DELETE CASCADE
ALTER TABLE public.team_members
ADD CONSTRAINT team_members_project_id_fkey
FOREIGN KEY (project_id)
REFERENCES public.projects (id)
ON DELETE CASCADE;

COMMIT; 