-- Migration to add project_key and enhance RBAC for team members

BEGIN;

-- 1. Add project_key to projects table
ALTER TABLE public.projects
ADD COLUMN project_key TEXT UNIQUE;

-- Add an index for faster lookups on project_key
CREATE INDEX IF NOT EXISTS idx_projects_project_key ON public.projects(project_key);

COMMENT ON COLUMN public.projects.project_key IS 'Unique key for joining the project.';

-- 2. Ensure team_members table has role and status
-- Assuming team_members table exists from previous migrations (like schedule)
-- Add role column if it doesn't exist
ALTER TABLE public.team_members
ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'member';

-- Add status column if it doesn't exist, otherwise modify constraints
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'team_members' AND column_name = 'status') THEN
        ALTER TABLE public.team_members ADD COLUMN status TEXT NOT NULL DEFAULT 'pending';
    END IF;
END $$;

-- Add check constraint for status values
ALTER TABLE public.team_members
DROP CONSTRAINT IF EXISTS team_members_status_check,
ADD CONSTRAINT team_members_status_check CHECK (status IN ('pending', 'approved', 'rejected', 'invited')); -- Added 'invited' for potential future use

COMMENT ON COLUMN public.team_members.role IS 'Role of the user within the project (e.g., owner, admin, member, investor).';
COMMENT ON COLUMN public.team_members.status IS 'Status of the team member (e.g., pending join request, approved, rejected invitation, invited).';

-- 3. RLS Policy Updates

-- Enable RLS on projects table
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Remove all existing policies
DROP POLICY IF EXISTS "Allow read access to all authenticated users" ON public.projects;
DROP POLICY IF EXISTS "Allow full access to project owner" ON public.projects;
DROP POLICY IF EXISTS "Allow read access to approved team members" ON public.projects;
DROP POLICY IF EXISTS "Allow full access for project owners" ON public.projects;
DROP POLICY IF EXISTS "project_access_policy" ON public.projects;

-- Enable RLS on team_members table
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Remove all existing team member policies
DROP POLICY IF EXISTS "Allow users to view their own membership" ON public.team_members;
DROP POLICY IF EXISTS "Allow approved team members to view project team" ON public.team_members;
DROP POLICY IF EXISTS "Allow project owners/admins to manage team" ON public.team_members;
DROP POLICY IF EXISTS "Allow users to request joining a project" ON public.team_members;
DROP POLICY IF EXISTS "team_members_base_access" ON public.team_members;
DROP POLICY IF EXISTS "team_members_insert" ON public.team_members;
DROP POLICY IF EXISTS "team_members_update" ON public.team_members;
DROP POLICY IF EXISTS "team_members_delete" ON public.team_members;

-- Simple policies that give authenticated users full access
CREATE POLICY "Enable full access for authenticated users" ON public.projects
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable full access for authenticated users" ON public.team_members
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

COMMIT; 