-- Link partner to-dos to a contract from the Contract Library (optional).

ALTER TABLE public.partner_todos
ADD COLUMN IF NOT EXISTS contract_id UUID REFERENCES public.contracts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_partner_todos_contract_id ON public.partner_todos(contract_id);

COMMENT ON COLUMN public.partner_todos.contract_id IS 'Optional Contract Library document the partner should open/sign.';

-- Partners may read a contract row only when it is attached to one of their to-dos (tighter than org-wide contract access).
CREATE POLICY "Partners can view contracts linked to partner todos"
    ON public.contracts
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM public.partner_todos pt
            JOIN public.partner_access pa ON pa.partner_invitation_id = pt.partner_invitation_id
            WHERE pt.contract_id = contracts.id
              AND pa.user_id = auth.uid()
        )
    );
