-- FINAL FIX: Use scalar subquery instead of EXISTS to avoid recursion
-- This is a simpler pattern that PostgreSQL can optimize better

-- Step 1: Drop ALL existing policies
DROP POLICY IF EXISTS "Organization owners can select their partner invitations" ON partner_invitations;
DROP POLICY IF EXISTS "Organization owners can insert their partner invitations" ON partner_invitations;
DROP POLICY IF EXISTS "Organization owners can update their partner invitations" ON partner_invitations;
DROP POLICY IF EXISTS "Organization owners can delete their partner invitations" ON partner_invitations;
DROP POLICY IF EXISTS "Partners can view their own invitations" ON partner_invitations;

-- Step 2: Create policies using scalar subquery (simpler than EXISTS)
-- This pattern is more direct and less likely to cause recursion
CREATE POLICY "Organization owners can select their partner invitations"
    ON partner_invitations
    FOR SELECT
    USING (
        (SELECT owner_id FROM organizations WHERE id = partner_invitations.organization_id) = auth.uid()
    );

CREATE POLICY "Organization owners can insert their partner invitations"
    ON partner_invitations
    FOR INSERT
    WITH CHECK (
        (SELECT owner_id FROM organizations WHERE id = partner_invitations.organization_id) = auth.uid()
    );

CREATE POLICY "Organization owners can update their partner invitations"
    ON partner_invitations
    FOR UPDATE
    USING (
        (SELECT owner_id FROM organizations WHERE id = partner_invitations.organization_id) = auth.uid()
    )
    WITH CHECK (
        (SELECT owner_id FROM organizations WHERE id = partner_invitations.organization_id) = auth.uid()
    );

CREATE POLICY "Organization owners can delete their partner invitations"
    ON partner_invitations
    FOR DELETE
    USING (
        (SELECT owner_id FROM organizations WHERE id = partner_invitations.organization_id) = auth.uid()
    );

-- Keep partner view policy simple (no user_id column in partner_invitations)
CREATE POLICY "Partners can view their own invitations"
    ON partner_invitations
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM partner_access
            WHERE partner_access.partner_invitation_id = partner_invitations.id
            AND partner_access.user_id = auth.uid()
        )
    );

