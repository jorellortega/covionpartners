-- Owner-assigned action items for a specific partner invitation (e.g. sign contract).
-- Partners can view and mark complete; owners manage full CRUD.

CREATE TABLE IF NOT EXISTS public.partner_todos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_invitation_id UUID NOT NULL REFERENCES public.partner_invitations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
    due_date TIMESTAMPTZ,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_partner_todos_invitation_id ON public.partner_todos(partner_invitation_id);
CREATE INDEX IF NOT EXISTS idx_partner_todos_status ON public.partner_todos(status);

ALTER TABLE public.partner_todos ENABLE ROW LEVEL SECURITY;

-- Organization owners: full access
CREATE POLICY "Organization owners can select partner todos"
    ON public.partner_todos FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.partner_invitations pi
            JOIN public.organizations o ON o.id = pi.organization_id
            WHERE pi.id = partner_todos.partner_invitation_id
            AND o.owner_id = auth.uid()
        )
    );

CREATE POLICY "Organization owners can insert partner todos"
    ON public.partner_todos FOR INSERT
    WITH CHECK (
        created_by = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.partner_invitations pi
            JOIN public.organizations o ON o.id = pi.organization_id
            WHERE pi.id = partner_todos.partner_invitation_id
            AND o.owner_id = auth.uid()
        )
    );

CREATE POLICY "Organization owners can update partner todos"
    ON public.partner_todos FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.partner_invitations pi
            JOIN public.organizations o ON o.id = pi.organization_id
            WHERE pi.id = partner_todos.partner_invitation_id
            AND o.owner_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.partner_invitations pi
            JOIN public.organizations o ON o.id = pi.organization_id
            WHERE pi.id = partner_todos.partner_invitation_id
            AND o.owner_id = auth.uid()
        )
    );

CREATE POLICY "Organization owners can delete partner todos"
    ON public.partner_todos FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.partner_invitations pi
            JOIN public.organizations o ON o.id = pi.organization_id
            WHERE pi.id = partner_todos.partner_invitation_id
            AND o.owner_id = auth.uid()
        )
    );

-- Partners: read todos for their invitation
CREATE POLICY "Partners can select their partner todos"
    ON public.partner_todos FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.partner_access pa
            WHERE pa.partner_invitation_id = partner_todos.partner_invitation_id
            AND pa.user_id = auth.uid()
        )
    );

-- Partners: mark complete / reopen (status + completed_at only enforced in app)
CREATE POLICY "Partners can update their partner todos"
    ON public.partner_todos FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.partner_access pa
            WHERE pa.partner_invitation_id = partner_todos.partner_invitation_id
            AND pa.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.partner_access pa
            WHERE pa.partner_invitation_id = partner_todos.partner_invitation_id
            AND pa.user_id = auth.uid()
        )
        AND status IN ('pending', 'completed')
    );

CREATE OR REPLACE FUNCTION public.update_partner_todos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_partner_todos_updated_at ON public.partner_todos;
CREATE TRIGGER set_partner_todos_updated_at
    BEFORE UPDATE ON public.partner_todos
    FOR EACH ROW
    EXECUTE FUNCTION public.update_partner_todos_updated_at();

COMMENT ON TABLE public.partner_todos IS 'Owner-assigned tasks for a partner (e.g. sign contract); partner marks complete.';
