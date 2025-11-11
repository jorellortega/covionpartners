-- Allow partners to view and create project comments
-- This migration updates the RLS policies for project_comments to include partner access

-- Drop existing policies that don't include partner access
DROP POLICY IF EXISTS "Users can view comments on their projects" ON public.project_comments;
DROP POLICY IF EXISTS "Users can create comments on their projects" ON public.project_comments;

-- Create new SELECT policy that includes partners
CREATE POLICY "Users can view comments on their projects"
    ON public.project_comments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.projects
            LEFT JOIN public.team_members ON team_members.project_id = projects.id
            WHERE projects.id = project_comments.project_id
            AND (
                projects.owner_id = auth.uid()
                OR team_members.user_id = auth.uid()
                OR projects.visibility = 'public'
            )
        )
        OR
        -- Allow partners with can_see_updates permission
        (
            auth.role() = 'authenticated'
            AND EXISTS (
                SELECT 1 
                FROM partner_access pa
                JOIN organization_partner_settings ops ON ops.partner_invitation_id = pa.partner_invitation_id
                WHERE pa.project_id = project_comments.project_id
                AND pa.user_id = auth.uid()
                AND ops.can_see_updates = true
            )
        )
    );

-- Create new INSERT policy that includes partners
CREATE POLICY "Users can create comments on their projects"
    ON public.project_comments
    FOR INSERT
    WITH CHECK (
        user_id = auth.uid()
        AND (
            EXISTS (
                SELECT 1 FROM public.projects
                LEFT JOIN public.team_members ON team_members.project_id = projects.id
                WHERE projects.id = project_comments.project_id
                AND (
                    projects.owner_id = auth.uid()
                    OR team_members.user_id = auth.uid()
                    OR projects.visibility = 'public'
                )
            )
            OR
            -- Allow partners with can_see_updates permission
            (
                auth.role() = 'authenticated'
                AND EXISTS (
                    SELECT 1 
                    FROM partner_access pa
                    JOIN organization_partner_settings ops ON ops.partner_invitation_id = pa.partner_invitation_id
                    WHERE pa.project_id = project_comments.project_id
                    AND pa.user_id = auth.uid()
                    AND ops.can_see_updates = true
                )
            )
        )
    );

