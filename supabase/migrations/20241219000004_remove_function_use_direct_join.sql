-- FINAL FIX: Remove function completely and use direct EXISTS subqueries
-- This eliminates any possibility of recursion

-- Step 1: Drop ALL policies that use the function
DROP POLICY IF EXISTS "Organization owners can select their partner invitations" ON partner_invitations;
DROP POLICY IF EXISTS "Organization owners can insert their partner invitations" ON partner_invitations;
DROP POLICY IF EXISTS "Organization owners can update their partner invitations" ON partner_invitations;
DROP POLICY IF EXISTS "Organization owners can delete their partner invitations" ON partner_invitations;

-- Drop policies on other tables that might use the function
DROP POLICY IF EXISTS "Organization owners can select partner access" ON partner_access;
DROP POLICY IF EXISTS "Organization owners can insert partner access" ON partner_access;
DROP POLICY IF EXISTS "Organization owners can update partner access" ON partner_access;
DROP POLICY IF EXISTS "Organization owners can delete partner access" ON partner_access;

DROP POLICY IF EXISTS "Organization owners can select partner settings" ON organization_partner_settings;
DROP POLICY IF EXISTS "Organization owners can insert partner settings" ON organization_partner_settings;
DROP POLICY IF EXISTS "Organization owners can update partner settings" ON organization_partner_settings;
DROP POLICY IF EXISTS "Organization owners can delete partner settings" ON organization_partner_settings;

-- Step 2: Now drop the function (safe since no policies depend on it)
DROP FUNCTION IF EXISTS is_organization_owner(UUID) CASCADE;

-- Step 3: Create new policies using DIRECT EXISTS subqueries (no function calls)
-- This avoids recursion because we're directly checking ownership without function calls

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

-- Recreate partner access policies
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

-- Recreate organization_partner_settings policies
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

