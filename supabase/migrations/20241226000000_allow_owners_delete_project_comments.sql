-- Allow organization owners and project owners to delete any comments on their projects
-- This migration updates the DELETE policy for project_comments

-- Drop existing delete policy
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.project_comments;

-- Create new DELETE policy that allows:
-- 1. Users to delete their own comments
-- 2. Project owners to delete any comment on their projects
-- 3. Organization owners to delete any comment on projects in their organization
CREATE POLICY "Users can delete their own comments or owners can delete any"
    ON public.project_comments
    FOR DELETE
    USING (
        -- Users can delete their own comments
        user_id = auth.uid()
        OR
        -- Project owners can delete any comment on their projects
        EXISTS (
            SELECT 1 FROM public.projects
            WHERE projects.id = project_comments.project_id
            AND projects.owner_id = auth.uid()
        )
        OR
        -- Organization owners can delete any comment on projects in their organization
        EXISTS (
            SELECT 1 FROM public.projects
            JOIN public.organizations ON organizations.id = projects.organization_id
            WHERE projects.id = project_comments.project_id
            AND organizations.owner_id = auth.uid()
        )
    );

