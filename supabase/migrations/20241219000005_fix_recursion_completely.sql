-- COMPLETE FIX: Fix both the policies AND the generate_partner_invitation_key function
-- The function also queries partner_invitations, which triggers RLS recursion

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

-- Step 2: Drop the function
DROP FUNCTION IF EXISTS is_organization_owner(UUID) CASCADE;

-- Step 3: Recreate generate_partner_invitation_key with SECURITY DEFINER to bypass RLS
DROP FUNCTION IF EXISTS generate_partner_invitation_key() CASCADE;

CREATE OR REPLACE FUNCTION generate_partner_invitation_key()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    generated_key TEXT;
    key_exists BOOLEAN;
    attempts INTEGER := 0;
BEGIN
    LOOP
        -- Generate a 32-character alphanumeric key
        generated_key := upper(
            substring(md5(random()::text || clock_timestamp()::text) from 1 for 8) || '-' ||
            substring(md5(random()::text || clock_timestamp()::text) from 1 for 8) || '-' ||
            substring(md5(random()::text || clock_timestamp()::text) from 1 for 8) || '-' ||
            substring(md5(random()::text || clock_timestamp()::text) from 1 for 8)
        );
        
        -- Check if key exists (SECURITY DEFINER bypasses RLS)
        SELECT EXISTS (
            SELECT 1 FROM partner_invitations WHERE invitation_key = generated_key
        ) INTO key_exists;
        
        IF NOT key_exists THEN
            RETURN generated_key;
        END IF;
        
        attempts := attempts + 1;
        IF attempts >= 100 THEN
            RAISE EXCEPTION 'Unable to generate unique partner invitation key after 100 attempts';
        END IF;
    END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION generate_partner_invitation_key() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_partner_invitation_key() TO service_role;

-- Step 4: Create a SECURITY DEFINER function to check organization ownership
-- This function bypasses RLS completely
CREATE OR REPLACE FUNCTION check_org_owner(org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT owner_id = auth.uid() FROM organizations WHERE id = org_id),
    false
  );
$$;

GRANT EXECUTE ON FUNCTION check_org_owner(UUID) TO authenticated;

-- Step 5: Create policies using the function (SECURITY DEFINER functions bypass RLS)
CREATE POLICY "Organization owners can select their partner invitations"
    ON partner_invitations
    FOR SELECT
    USING (check_org_owner(organization_id));

CREATE POLICY "Organization owners can insert their partner invitations"
    ON partner_invitations
    FOR INSERT
    WITH CHECK (check_org_owner(organization_id));

CREATE POLICY "Organization owners can update their partner invitations"
    ON partner_invitations
    FOR UPDATE
    USING (check_org_owner(organization_id))
    WITH CHECK (check_org_owner(organization_id));

CREATE POLICY "Organization owners can delete their partner invitations"
    ON partner_invitations
    FOR DELETE
    USING (check_org_owner(organization_id));

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

-- Step 6: Create partner_access policies
CREATE POLICY "Organization owners can select partner access"
    ON partner_access
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 
            FROM partner_invitations pi
            WHERE pi.id = partner_access.partner_invitation_id 
            AND check_org_owner(pi.organization_id)
        )
    );

CREATE POLICY "Organization owners can insert partner access"
    ON partner_access
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 
            FROM partner_invitations pi
            WHERE pi.id = partner_access.partner_invitation_id 
            AND check_org_owner(pi.organization_id)
        )
    );

CREATE POLICY "Organization owners can update partner access"
    ON partner_access
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 
            FROM partner_invitations pi
            WHERE pi.id = partner_access.partner_invitation_id 
            AND check_org_owner(pi.organization_id)
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 
            FROM partner_invitations pi
            WHERE pi.id = partner_access.partner_invitation_id 
            AND check_org_owner(pi.organization_id)
        )
    );

CREATE POLICY "Organization owners can delete partner access"
    ON partner_access
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 
            FROM partner_invitations pi
            WHERE pi.id = partner_access.partner_invitation_id 
            AND check_org_owner(pi.organization_id)
        )
    );

CREATE POLICY "Partners can view their own access"
    ON partner_access
    FOR SELECT
    USING (user_id = auth.uid());

-- Step 7: Create organization_partner_settings policies
CREATE POLICY "Organization owners can select partner settings"
    ON organization_partner_settings
    FOR SELECT
    USING (check_org_owner(organization_id));

CREATE POLICY "Organization owners can insert partner settings"
    ON organization_partner_settings
    FOR INSERT
    WITH CHECK (check_org_owner(organization_id));

CREATE POLICY "Organization owners can update partner settings"
    ON organization_partner_settings
    FOR UPDATE
    USING (check_org_owner(organization_id))
    WITH CHECK (check_org_owner(organization_id));

CREATE POLICY "Organization owners can delete partner settings"
    ON organization_partner_settings
    FOR DELETE
    USING (check_org_owner(organization_id));

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

