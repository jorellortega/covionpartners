-- Final fix for infinite recursion in partner_invitations RLS policies
-- This uses a simpler approach that directly checks ownership without recursion

-- Drop all existing policies FIRST (before dropping the function)
DROP POLICY IF EXISTS "Organization owners can manage their partner invitations" ON partner_invitations;
DROP POLICY IF EXISTS "Organization owners can select their partner invitations" ON partner_invitations;
DROP POLICY IF EXISTS "Organization owners can insert their partner invitations" ON partner_invitations;
DROP POLICY IF EXISTS "Organization owners can update their partner invitations" ON partner_invitations;
DROP POLICY IF EXISTS "Organization owners can delete their partner invitations" ON partner_invitations;
DROP POLICY IF EXISTS "Partners can view their own invitations" ON partner_invitations;

-- Drop policies for partner_access
DROP POLICY IF EXISTS "Organization owners can manage partner access" ON partner_access;
DROP POLICY IF EXISTS "Organization owners can select partner access" ON partner_access;
DROP POLICY IF EXISTS "Organization owners can insert partner access" ON partner_access;
DROP POLICY IF EXISTS "Organization owners can update partner access" ON partner_access;
DROP POLICY IF EXISTS "Organization owners can delete partner access" ON partner_access;

-- Drop policies for organization_partner_settings
DROP POLICY IF EXISTS "Organization owners can manage partner settings" ON organization_partner_settings;
DROP POLICY IF EXISTS "Organization owners can select partner settings" ON organization_partner_settings;
DROP POLICY IF EXISTS "Organization owners can insert partner settings" ON organization_partner_settings;
DROP POLICY IF EXISTS "Organization owners can update partner settings" ON organization_partner_settings;
DROP POLICY IF EXISTS "Organization owners can delete partner settings" ON organization_partner_settings;

-- Now drop the function (policies are dropped, so it's safe)
DROP FUNCTION IF EXISTS is_organization_owner(UUID);

-- Create a function that bypasses RLS completely
CREATE FUNCTION is_organization_owner(org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  -- SECURITY DEFINER bypasses RLS, so this query won't trigger recursion
  -- COALESCE handles NULL case (when org doesn't exist)
  SELECT COALESCE(
    (SELECT owner_id = auth.uid() FROM organizations WHERE id = org_id),
    false
  );
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION is_organization_owner(UUID) TO authenticated;

-- Create policies using the function
CREATE POLICY "Organization owners can select their partner invitations"
    ON partner_invitations
    FOR SELECT
    USING (is_organization_owner(organization_id));

CREATE POLICY "Organization owners can insert their partner invitations"
    ON partner_invitations
    FOR INSERT
    WITH CHECK (is_organization_owner(organization_id));

CREATE POLICY "Organization owners can update their partner invitations"
    ON partner_invitations
    FOR UPDATE
    USING (is_organization_owner(organization_id))
    WITH CHECK (is_organization_owner(organization_id));

CREATE POLICY "Organization owners can delete their partner invitations"
    ON partner_invitations
    FOR DELETE
    USING (is_organization_owner(organization_id));

-- Recreate the partner view policy
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

-- Recreate policies for partner_access
CREATE POLICY "Organization owners can select partner access"
    ON partner_access
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM partner_invitations
            WHERE partner_invitations.id = partner_access.partner_invitation_id
            AND is_organization_owner(partner_invitations.organization_id)
        )
    );

CREATE POLICY "Organization owners can insert partner access"
    ON partner_access
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM partner_invitations
            WHERE partner_invitations.id = partner_access.partner_invitation_id
            AND is_organization_owner(partner_invitations.organization_id)
        )
    );

CREATE POLICY "Organization owners can update partner access"
    ON partner_access
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM partner_invitations
            WHERE partner_invitations.id = partner_access.partner_invitation_id
            AND is_organization_owner(partner_invitations.organization_id)
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM partner_invitations
            WHERE partner_invitations.id = partner_access.partner_invitation_id
            AND is_organization_owner(partner_invitations.organization_id)
        )
    );

CREATE POLICY "Organization owners can delete partner access"
    ON partner_access
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM partner_invitations
            WHERE partner_invitations.id = partner_access.partner_invitation_id
            AND is_organization_owner(partner_invitations.organization_id)
        )
    );

-- Recreate policies for organization_partner_settings
CREATE POLICY "Organization owners can select partner settings"
    ON organization_partner_settings
    FOR SELECT
    USING (is_organization_owner(organization_id));

CREATE POLICY "Organization owners can insert partner settings"
    ON organization_partner_settings
    FOR INSERT
    WITH CHECK (is_organization_owner(organization_id));

CREATE POLICY "Organization owners can update partner settings"
    ON organization_partner_settings
    FOR UPDATE
    USING (is_organization_owner(organization_id))
    WITH CHECK (is_organization_owner(organization_id));

CREATE POLICY "Organization owners can delete partner settings"
    ON organization_partner_settings
    FOR DELETE
    USING (is_organization_owner(organization_id));

