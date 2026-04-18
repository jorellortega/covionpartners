-- Scope project comments to a partner invitation so partners on the same project
-- only see their own thread (not other partners' comments).

ALTER TABLE public.project_comments
ADD COLUMN IF NOT EXISTS partner_invitation_id UUID REFERENCES public.partner_invitations(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS project_comments_partner_invitation_id_idx
  ON public.project_comments(partner_invitation_id);

COMMENT ON COLUMN public.project_comments.partner_invitation_id IS
  'Thread scope: partner sees only rows matching their invitation; org/team comments may use NULL or target an invitation.';

-- Backfill partner-originated comments from partner_access
UPDATE public.project_comments pc
SET partner_invitation_id = pa.partner_invitation_id
FROM public.partner_access pa
WHERE pa.project_id = pc.project_id
  AND pa.user_id = pc.user_id
  AND pc.partner_invitation_id IS NULL;

-- RLS: replace SELECT / INSERT so partners are scoped by invitation; org owners still see all.

DROP POLICY IF EXISTS "Users can view comments on their projects" ON public.project_comments;
DROP POLICY IF EXISTS "Users can create comments on their projects" ON public.project_comments;

CREATE POLICY "Users can view comments on their projects"
  ON public.project_comments
  FOR SELECT
  USING (
    -- Organization owners: all comments on org projects
    EXISTS (
      SELECT 1 FROM public.projects
      JOIN public.organizations ON organizations.id = projects.organization_id
      WHERE projects.id = project_comments.project_id
        AND organizations.owner_id = auth.uid()
    )
    OR
    -- Project owner (direct)
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_comments.project_id
        AND projects.owner_id = auth.uid()
    )
    OR
    -- Team members (only when not a partner viewer on this project)
    (
      EXISTS (
        SELECT 1 FROM public.projects
        LEFT JOIN public.team_members ON team_members.project_id = projects.id
        WHERE projects.id = project_comments.project_id
          AND team_members.user_id = auth.uid()
      )
      AND NOT EXISTS (
        SELECT 1 FROM public.partner_access pa
        WHERE pa.project_id = project_comments.project_id
          AND pa.user_id = auth.uid()
      )
    )
    OR
    -- Public projects (non-partners only)
    (
      EXISTS (
        SELECT 1 FROM public.projects
        WHERE projects.id = project_comments.project_id
          AND projects.visibility = 'public'
      )
      AND NOT EXISTS (
        SELECT 1 FROM public.partner_access pa
        WHERE pa.project_id = project_comments.project_id
          AND pa.user_id = auth.uid()
      )
    )
    OR
    -- Partners: invitation-scoped thread only
    EXISTS (
      SELECT 1 FROM public.partner_access pa
      JOIN public.organization_partner_settings ops ON ops.partner_invitation_id = pa.partner_invitation_id
      WHERE pa.project_id = project_comments.project_id
        AND pa.user_id = auth.uid()
        AND ops.can_see_updates = true
        AND project_comments.partner_invitation_id = pa.partner_invitation_id
    )
  );

CREATE POLICY "Users can create comments on their projects"
  ON public.project_comments
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND (
      -- Org or project owner / team / public (non-partner path)
      (
        NOT EXISTS (
          SELECT 1 FROM public.partner_access pa
          WHERE pa.project_id = project_comments.project_id
            AND pa.user_id = auth.uid()
        )
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
        )
      )
      OR
      -- Organization owner can insert on any org project (e.g. reply on a partner thread)
      EXISTS (
        SELECT 1 FROM public.projects
        JOIN public.organizations ON organizations.id = projects.organization_id
        WHERE projects.id = project_comments.project_id
          AND organizations.owner_id = auth.uid()
      )
      OR
      -- Partner: must set invitation to their own access row
      EXISTS (
        SELECT 1 FROM public.partner_access pa
        JOIN public.organization_partner_settings ops ON ops.partner_invitation_id = pa.partner_invitation_id
        WHERE pa.project_id = project_comments.project_id
          AND pa.user_id = auth.uid()
          AND ops.can_see_updates = true
          AND pa.partner_invitation_id = project_comments.partner_invitation_id
      )
    )
  );
