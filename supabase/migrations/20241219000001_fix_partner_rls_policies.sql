-- Fix RLS policies for partner system
-- This migration fixes the policies to use explicit SELECT/INSERT/UPDATE/DELETE instead of FOR ALL
-- Also fixes infinite recursion by using a more direct check

-- Drop existing policies for partner_invitations
DROP POLICY IF EXISTS "Organization owners can manage their partner invitations" ON partner_invitations;
DROP POLICY IF EXISTS "Organization owners can select their partner invitations" ON partner_invitations;
DROP POLICY IF EXISTS "Organization owners can insert their partner invitations" ON partner_invitations;
DROP POLICY IF EXISTS "Organization owners can update their partner invitations" ON partner_invitations;
DROP POLICY IF EXISTS "Organization owners can delete their partner invitations" ON partner_invitations;

-- Create new explicit policies for partner_invitations
-- Using a function to avoid recursion issues
-- This function bypasses RLS by using SECURITY DEFINER and checking ownership directly
CREATE OR REPLACE FUNCTION is_organization_owner(org_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  org_owner_id UUID;
BEGIN
  -- Directly query organizations table without RLS (due to SECURITY DEFINER)
  -- This avoids infinite recursion by bypassing all RLS policies
  -- Use pg_catalog to ensure we're not triggering any RLS
  SELECT o.owner_id INTO org_owner_id
  FROM public.organizations o
  WHERE o.id = org_id
  LIMIT 1;
  
  -- Return false if org not found or owner doesn't match
  IF org_owner_id IS NULL THEN
    RETURN false;
  END IF;
  
  RETURN org_owner_id = auth.uid();
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

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

-- Drop existing policies for partner_access
DROP POLICY IF EXISTS "Organization owners can manage partner access" ON partner_access;
DROP POLICY IF EXISTS "Organization owners can select partner access" ON partner_access;
DROP POLICY IF EXISTS "Organization owners can insert partner access" ON partner_access;
DROP POLICY IF EXISTS "Organization owners can update partner access" ON partner_access;
DROP POLICY IF EXISTS "Organization owners can delete partner access" ON partner_access;

-- Create new explicit policies for partner_access
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

-- Drop existing policies for organization_partner_settings
DROP POLICY IF EXISTS "Organization owners can manage partner settings" ON organization_partner_settings;
DROP POLICY IF EXISTS "Organization owners can select partner settings" ON organization_partner_settings;
DROP POLICY IF EXISTS "Organization owners can insert partner settings" ON organization_partner_settings;
DROP POLICY IF EXISTS "Organization owners can update partner settings" ON organization_partner_settings;
DROP POLICY IF EXISTS "Organization owners can delete partner settings" ON organization_partner_settings;

-- Create new explicit policies for organization_partner_settings
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

-- Grant execute permission on the helper function
GRANT EXECUTE ON FUNCTION is_organization_owner(UUID) TO authenticated;

