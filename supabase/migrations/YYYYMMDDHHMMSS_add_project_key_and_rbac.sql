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

-- 3. RLS Policy Updates (Initial Setup - more specific policies later)

-- Enable RLS on projects table if not already enabled
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Remove existing policies to avoid conflicts (adjust if needed based on existing setup)
DROP POLICY IF EXISTS "Allow read access to all authenticated users" ON public.projects;
DROP POLICY IF EXISTS "Allow full access to project owner" ON public.projects; -- Example if exists

-- Allow approved team members to read project details
CREATE POLICY "Allow read access to approved team members" ON public.projects
FOR SELECT USING (
  EXISTS (
    SELECT 1
    FROM public.team_members tm
    WHERE tm.project_id = projects.id
      AND tm.user_id = auth.uid()
      AND tm.status = 'approved'
  )
);

-- Allow project owners (defined by owner_id) full access
-- Assuming owner_id refers to the user who created the project
CREATE POLICY "Allow full access for project owners" ON public.projects
FOR ALL USING (
  auth.uid() = owner_id
) WITH CHECK (
  auth.uid() = owner_id
);

-- Enable RLS on team_members table
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Remove existing policies on team_members
DROP POLICY IF EXISTS "Allow authenticated users to view team members" ON public.team_members; -- Example
DROP POLICY IF EXISTS "Allow users to manage their own membership" ON public.team_members; -- Example

-- Allow users to see their own team member record
CREATE POLICY "Allow users to view their own membership" ON public.team_members
FOR SELECT USING (
  auth.uid() = user_id
);

-- Allow approved team members of the same project to see each other
CREATE POLICY "Allow approved team members to view project team" ON public.team_members
FOR SELECT USING (
  EXISTS (
    SELECT 1
    FROM public.team_members tm_check
    WHERE tm_check.project_id = team_members.project_id -- Check if the viewer is in the same project
      AND tm_check.user_id = auth.uid()
      AND tm_check.status = 'approved'
  )
);

-- Allow project owners/admins to manage team members (INSERT, UPDATE, DELETE)
-- This needs refinement based on 'role' checks later
CREATE POLICY "Allow project owners/admins to manage team" ON public.team_members
FOR ALL USING (
  EXISTS (
    SELECT 1
    FROM public.team_members tm_admin_check
    WHERE tm_admin_check.project_id = team_members.project_id
      AND tm_admin_check.user_id = auth.uid()
      AND tm_admin_check.status = 'approved'
      AND (tm_admin_check.role = 'owner' OR tm_admin_check.role = 'admin') -- Check if the user is owner or admin
  )
) WITH CHECK (
   EXISTS (
    SELECT 1
    FROM public.team_members tm_admin_check
    WHERE tm_admin_check.project_id = team_members.project_id
      AND tm_admin_check.user_id = auth.uid()
      AND tm_admin_check.status = 'approved'
      AND (tm_admin_check.role = 'owner' OR tm_admin_check.role = 'admin')
  )
);

-- Allow authenticated users to insert a PENDING request for themselves
CREATE POLICY "Allow users to request joining a project" ON public.team_members
FOR INSERT WITH CHECK (
  auth.uid() = user_id AND status = 'pending'
);


COMMIT; 