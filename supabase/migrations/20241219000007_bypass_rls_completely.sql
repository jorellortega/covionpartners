-- FINAL FIX: Use a different approach - query organizations table directly without any function calls
-- This completely avoids recursion by not using functions in policies at all

-- Step 1: Drop ALL existing policies
DROP POLICY IF EXISTS "Organization owners can select their partner invitations" ON partner_invitations;
DROP POLICY IF EXISTS "Organization owners can insert their partner invitations" ON partner_invitations;
DROP POLICY IF EXISTS "Organization owners can update their partner invitations" ON partner_invitations;
DROP POLICY IF EXISTS "Organization owners can delete their partner invitations" ON partner_invitations;
DROP POLICY IF EXISTS "Partners can view their own invitations" ON partner_invitations;

-- Step 2: Drop the function (we won't use it in policies)
DROP FUNCTION IF EXISTS check_org_owner(UUID) CASCADE;

-- Step 3: Create policies using DIRECT subquery that checks organizations table
-- The key is to use a simple EXISTS that doesn't trigger recursion
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

-- Keep the partner view policy as is
-- (The "Partners can view their own invitations" policy should already exist, but let's recreate it to be safe)
DROP POLICY IF EXISTS "Partners can view their own invitations" ON partner_invitations;

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

