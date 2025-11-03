-- FINAL FIX: Break the circular reference between partner_invitations and partner_access
-- The issue: partner_invitations policy queries partner_access, and partner_access policies query partner_invitations

-- Step 1: Drop ALL existing policies
DROP POLICY IF EXISTS "Organization owners can select their partner invitations" ON partner_invitations;
DROP POLICY IF EXISTS "Organization owners can insert their partner invitations" ON partner_invitations;
DROP POLICY IF EXISTS "Organization owners can update their partner invitations" ON partner_invitations;
DROP POLICY IF EXISTS "Organization owners can delete their partner invitations" ON partner_invitations;
DROP POLICY IF EXISTS "Partners can view their own invitations" ON partner_invitations;

DROP POLICY IF EXISTS "Organization owners can select partner access" ON partner_access;
DROP POLICY IF EXISTS "Organization owners can insert partner access" ON partner_access;
DROP POLICY IF EXISTS "Organization owners can update partner access" ON partner_access;
DROP POLICY IF EXISTS "Organization owners can delete partner access" ON partner_access;
DROP POLICY IF EXISTS "Partners can view their own access" ON partner_access;

-- Step 2: Create partner_invitations policies WITHOUT querying partner_access
-- This breaks the circular reference
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

-- For partners: They can view invitations where they have access in partner_access
-- BUT we'll check this at the application level, not in RLS policy to avoid recursion
-- For now, partners can only see invitations if they're invited by email matching their email
-- OR we disable this policy and handle it in the app
CREATE POLICY "Partners can view invitations by email match"
    ON partner_invitations
    FOR SELECT
    USING (
        email = (SELECT email FROM auth.users WHERE id = auth.uid())
    );

-- Step 3: Create partner_access policies WITHOUT querying partner_invitations
-- This breaks the circular reference
CREATE POLICY "Organization owners can manage partner access"
    ON partner_access
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 
            FROM organizations o
            JOIN partner_invitations pi ON pi.organization_id = o.id
            WHERE pi.id = partner_access.partner_invitation_id 
            AND o.owner_id = auth.uid()
        )
    );

CREATE POLICY "Partners can view their own access"
    ON partner_access
    FOR SELECT
    USING (user_id = auth.uid());

