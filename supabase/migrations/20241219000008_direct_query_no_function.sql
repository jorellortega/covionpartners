-- FINAL FIX: Since organizations has RLS disabled, query it directly without any function
-- This eliminates all recursion possibilities

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

DROP POLICY IF EXISTS "Organization owners can select partner settings" ON organization_partner_settings;
DROP POLICY IF EXISTS "Organization owners can insert partner settings" ON organization_partner_settings;
DROP POLICY IF EXISTS "Organization owners can update partner settings" ON organization_partner_settings;
DROP POLICY IF EXISTS "Organization owners can delete partner settings" ON organization_partner_settings;
DROP POLICY IF EXISTS "Partners can view their own settings" ON organization_partner_settings;

-- Step 2: Drop the function (not needed anymore)
DROP FUNCTION IF EXISTS check_org_owner(UUID) CASCADE;

-- Step 3: Create policies using DIRECT subquery (no function calls)
-- Since organizations has RLS disabled, we can query it directly
CREATE POLICY "Organization owners can select their partner invitations"
    ON partner_invitations
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 
            FROM organizations 
            WHERE organizations.id = partner_invitations.organization_id 
            AND organizations.owner_id = auth.uid()
        )
    );

CREATE POLICY "Organization owners can insert their partner invitations"
    ON partner_invitations
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 
            FROM organizations 
            WHERE organizations.id = partner_invitations.organization_id 
            AND organizations.owner_id = auth.uid()
        )
    );

CREATE POLICY "Organization owners can update their partner invitations"
    ON partner_invitations
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 
            FROM organizations 
            WHERE organizations.id = partner_invitations.organization_id 
            AND organizations.owner_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 
            FROM organizations 
            WHERE organizations.id = partner_invitations.organization_id 
            AND organizations.owner_id = auth.uid()
        )
    );

CREATE POLICY "Organization owners can delete their partner invitations"
    ON partner_invitations
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 
            FROM organizations 
            WHERE organizations.id = partner_invitations.organization_id 
            AND organizations.owner_id = auth.uid()
        )
    );

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

-- Step 4: Create partner_access policies
CREATE POLICY "Organization owners can select partner access"
    ON partner_access
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 
            FROM partner_invitations pi
            INNER JOIN organizations o ON o.id = pi.organization_id
            WHERE pi.id = partner_access.partner_invitation_id 
            AND o.owner_id = auth.uid()
        )
    );

CREATE POLICY "Organization owners can insert partner access"
    ON partner_access
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 
            FROM partner_invitations pi
            INNER JOIN organizations o ON o.id = pi.organization_id
            WHERE pi.id = partner_access.partner_invitation_id 
            AND o.owner_id = auth.uid()
        )
    );

CREATE POLICY "Organization owners can update partner access"
    ON partner_access
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 
            FROM partner_invitations pi
            INNER JOIN organizations o ON o.id = pi.organization_id
            WHERE pi.id = partner_access.partner_invitation_id 
            AND o.owner_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 
            FROM partner_invitations pi
            INNER JOIN organizations o ON o.id = pi.organization_id
            WHERE pi.id = partner_access.partner_invitation_id 
            AND o.owner_id = auth.uid()
        )
    );

CREATE POLICY "Organization owners can delete partner access"
    ON partner_access
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 
            FROM partner_invitations pi
            INNER JOIN organizations o ON o.id = pi.organization_id
            WHERE pi.id = partner_access.partner_invitation_id 
            AND o.owner_id = auth.uid()
        )
    );

CREATE POLICY "Partners can view their own access"
    ON partner_access
    FOR SELECT
    USING (user_id = auth.uid());

-- Step 5: Create organization_partner_settings policies
CREATE POLICY "Organization owners can select partner settings"
    ON organization_partner_settings
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 
            FROM organizations 
            WHERE organizations.id = organization_partner_settings.organization_id 
            AND organizations.owner_id = auth.uid()
        )
    );

CREATE POLICY "Organization owners can insert partner settings"
    ON organization_partner_settings
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 
            FROM organizations 
            WHERE organizations.id = organization_partner_settings.organization_id 
            AND organizations.owner_id = auth.uid()
        )
    );

CREATE POLICY "Organization owners can update partner settings"
    ON organization_partner_settings
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 
            FROM organizations 
            WHERE organizations.id = organization_partner_settings.organization_id 
            AND organizations.owner_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 
            FROM organizations 
            WHERE organizations.id = organization_partner_settings.organization_id 
            AND organizations.owner_id = auth.uid()
        )
    );

CREATE POLICY "Organization owners can delete partner settings"
    ON organization_partner_settings
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 
            FROM organizations 
            WHERE organizations.id = organization_partner_settings.organization_id 
            AND organizations.owner_id = auth.uid()
        )
    );

CREATE POLICY "Partners can view their own settings"
    ON organization_partner_settings
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 
            FROM partner_access pa
            JOIN partner_invitations pi ON pi.id = pa.partner_invitation_id
            WHERE pa.user_id = auth.uid()
            AND pi.id = organization_partner_settings.partner_invitation_id
        )
    );

