-- FINAL FIX: Remove function entirely and use direct join in policies
-- This avoids all recursion issues

-- Drop all existing policies
DROP POLICY IF EXISTS "Organization owners can manage their partner invitations" ON partner_invitations;
DROP POLICY IF EXISTS "Organization owners can select their partner invitations" ON partner_invitations;
DROP POLICY IF EXISTS "Organization owners can insert their partner invitations" ON partner_invitations;
DROP POLICY IF EXISTS "Organization owners can update their partner invitations" ON partner_invitations;
DROP POLICY IF EXISTS "Organization owners can delete their partner invitations" ON partner_invitations;
DROP POLICY IF EXISTS "Partners can view their own invitations" ON partner_invitations;

DROP POLICY IF EXISTS "Organization owners can manage partner access" ON partner_access;
DROP POLICY IF EXISTS "Organization owners can select partner access" ON partner_access;
DROP POLICY IF EXISTS "Organization owners can insert partner access" ON partner_access;
DROP POLICY IF EXISTS "Organization owners can update partner access" ON partner_access;
DROP POLICY IF EXISTS "Organization owners can delete partner access" ON partner_access;
DROP POLICY IF EXISTS "Partners can view their own access" ON partner_access;

DROP POLICY IF EXISTS "Organization owners can manage partner settings" ON organization_partner_settings;
DROP POLICY IF EXISTS "Organization owners can select partner settings" ON organization_partner_settings;
DROP POLICY IF EXISTS "Organization owners can insert partner settings" ON organization_partner_settings;
DROP POLICY IF EXISTS "Organization owners can update partner settings" ON organization_partner_settings;
DROP POLICY IF EXISTS "Organization owners can delete partner settings" ON organization_partner_settings;
DROP POLICY IF EXISTS "Partners can view their own settings" ON organization_partner_settings;

-- Drop the function (if it exists)
DROP FUNCTION IF EXISTS is_organization_owner(UUID) CASCADE;

-- Create policies for partner_invitations using direct join
-- This avoids recursion by using a simple EXISTS subquery that checks ownership directly
CREATE POLICY "Organization owners can select their partner invitations"
    ON partner_invitations
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 
            FROM organizations o
            WHERE o.id = partner_invitations.organization_id
            AND o.owner_id = auth.uid()
        )
    );

CREATE POLICY "Organization owners can insert their partner invitations"
    ON partner_invitations
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 
            FROM organizations o
            WHERE o.id = partner_invitations.organization_id
            AND o.owner_id = auth.uid()
        )
    );

CREATE POLICY "Organization owners can update their partner invitations"
    ON partner_invitations
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 
            FROM organizations o
            WHERE o.id = partner_invitations.organization_id
            AND o.owner_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 
            FROM organizations o
            WHERE o.id = partner_invitations.organization_id
            AND o.owner_id = auth.uid()
        )
    );

CREATE POLICY "Organization owners can delete their partner invitations"
    ON partner_invitations
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 
            FROM organizations o
            WHERE o.id = partner_invitations.organization_id
            AND o.owner_id = auth.uid()
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

-- Create policies for partner_access
CREATE POLICY "Organization owners can select partner access"
    ON partner_access
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 
            FROM partner_invitations pi
            JOIN organizations o ON o.id = pi.organization_id
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
            JOIN organizations o ON o.id = pi.organization_id
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
            JOIN organizations o ON o.id = pi.organization_id
            WHERE pi.id = partner_access.partner_invitation_id
            AND o.owner_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 
            FROM partner_invitations pi
            JOIN organizations o ON o.id = pi.organization_id
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
            JOIN organizations o ON o.id = pi.organization_id
            WHERE pi.id = partner_access.partner_invitation_id
            AND o.owner_id = auth.uid()
        )
    );

CREATE POLICY "Partners can view their own access"
    ON partner_access
    FOR SELECT
    USING (
        user_id = auth.uid()
    );

-- Create policies for organization_partner_settings
CREATE POLICY "Organization owners can select partner settings"
    ON organization_partner_settings
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 
            FROM organizations o
            WHERE o.id = organization_partner_settings.organization_id
            AND o.owner_id = auth.uid()
        )
    );

CREATE POLICY "Organization owners can insert partner settings"
    ON organization_partner_settings
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 
            FROM organizations o
            WHERE o.id = organization_partner_settings.organization_id
            AND o.owner_id = auth.uid()
        )
    );

CREATE POLICY "Organization owners can update partner settings"
    ON organization_partner_settings
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 
            FROM organizations o
            WHERE o.id = organization_partner_settings.organization_id
            AND o.owner_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 
            FROM organizations o
            WHERE o.id = organization_partner_settings.organization_id
            AND o.owner_id = auth.uid()
        )
    );

CREATE POLICY "Organization owners can delete partner settings"
    ON organization_partner_settings
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 
            FROM organizations o
            WHERE o.id = organization_partner_settings.organization_id
            AND o.owner_id = auth.uid()
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

