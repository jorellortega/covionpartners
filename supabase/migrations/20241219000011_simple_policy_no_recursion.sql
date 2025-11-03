-- SIMPLE FIX: Minimal policies with NO circular references
-- Since organizations has RLS disabled, we can query it directly

-- Step 1: Drop ALL existing policies
DROP POLICY IF EXISTS "Organization owners can select their partner invitations" ON partner_invitations;
DROP POLICY IF EXISTS "Organization owners can insert their partner invitations" ON partner_invitations;
DROP POLICY IF EXISTS "Organization owners can update their partner invitations" ON partner_invitations;
DROP POLICY IF EXISTS "Organization owners can delete their partner invitations" ON partner_invitations;
DROP POLICY IF EXISTS "Partners can view their own invitations" ON partner_invitations;
DROP POLICY IF EXISTS "Partners can view invitations by email match" ON partner_invitations;

-- Step 2: Create ONLY the organization owner policies
-- No partner policies - we'll handle partner access in the application layer
CREATE POLICY "Organization owners can select their partner invitations"
    ON partner_invitations
    FOR SELECT
    USING (
        (SELECT owner_id FROM organizations WHERE id = partner_invitations.organization_id LIMIT 1) = auth.uid()
    );

CREATE POLICY "Organization owners can insert their partner invitations"
    ON partner_invitations
    FOR INSERT
    WITH CHECK (
        (SELECT owner_id FROM organizations WHERE id = partner_invitations.organization_id LIMIT 1) = auth.uid()
    );

CREATE POLICY "Organization owners can update their partner invitations"
    ON partner_invitations
    FOR UPDATE
    USING (
        (SELECT owner_id FROM organizations WHERE id = partner_invitations.organization_id LIMIT 1) = auth.uid()
    )
    WITH CHECK (
        (SELECT owner_id FROM organizations WHERE id = partner_invitations.organization_id LIMIT 1) = auth.uid()
    );

CREATE POLICY "Organization owners can delete their partner invitations"
    ON partner_invitations
    FOR DELETE
    USING (
        (SELECT owner_id FROM organizations WHERE id = partner_invitations.organization_id LIMIT 1) = auth.uid()
    );

-- NOTE: Partner access will be handled in application code, not in RLS policies
-- This avoids all circular reference issues

