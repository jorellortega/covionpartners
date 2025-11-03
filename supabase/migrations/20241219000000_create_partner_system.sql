-- Create partner system for organizations
-- Allows organization owners to invite partners and control what they can see

-- Partner invitations table
CREATE TABLE IF NOT EXISTS partner_invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    invitation_key TEXT NOT NULL UNIQUE,
    email TEXT,
    invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Partner access table (stores which partners have access to which projects)
CREATE TABLE IF NOT EXISTS partner_access (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    partner_invitation_id UUID NOT NULL REFERENCES partner_invitations(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(partner_invitation_id, project_id)
);

-- Organization partner settings (controls what partners can see)
CREATE TABLE IF NOT EXISTS organization_partner_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    partner_invitation_id UUID REFERENCES partner_invitations(id) ON DELETE CASCADE,
    -- Visibility settings
    can_see_updates BOOLEAN DEFAULT false,
    can_see_project_info BOOLEAN DEFAULT false,
    can_see_dates BOOLEAN DEFAULT false,
    can_see_expenses BOOLEAN DEFAULT false,
    can_see_progress BOOLEAN DEFAULT false,
    can_see_team_members BOOLEAN DEFAULT false,
    can_see_budget BOOLEAN DEFAULT false,
    can_see_funding BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(organization_id, partner_invitation_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_partner_invitations_organization_id ON partner_invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_partner_invitations_invitation_key ON partner_invitations(invitation_key);
CREATE INDEX IF NOT EXISTS idx_partner_invitations_status ON partner_invitations(status);
CREATE INDEX IF NOT EXISTS idx_partner_access_invitation_id ON partner_access(partner_invitation_id);
CREATE INDEX IF NOT EXISTS idx_partner_access_project_id ON partner_access(project_id);
CREATE INDEX IF NOT EXISTS idx_partner_access_user_id ON partner_access(user_id);
CREATE INDEX IF NOT EXISTS idx_org_partner_settings_org_id ON organization_partner_settings(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_partner_settings_invitation_id ON organization_partner_settings(partner_invitation_id);

-- Enable RLS
ALTER TABLE partner_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_partner_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for partner_invitations
CREATE POLICY "Organization owners can select their partner invitations"
    ON partner_invitations
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM organizations
            WHERE organizations.id = partner_invitations.organization_id
            AND organizations.owner_id = auth.uid()
        )
    );

CREATE POLICY "Organization owners can insert their partner invitations"
    ON partner_invitations
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM organizations
            WHERE organizations.id = partner_invitations.organization_id
            AND organizations.owner_id = auth.uid()
        )
    );

CREATE POLICY "Organization owners can update their partner invitations"
    ON partner_invitations
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM organizations
            WHERE organizations.id = partner_invitations.organization_id
            AND organizations.owner_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM organizations
            WHERE organizations.id = partner_invitations.organization_id
            AND organizations.owner_id = auth.uid()
        )
    );

CREATE POLICY "Organization owners can delete their partner invitations"
    ON partner_invitations
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM organizations
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
        OR invitation_key = current_setting('app.partner_key', true)::text
    );

-- RLS Policies for partner_access
CREATE POLICY "Organization owners can select partner access"
    ON partner_access
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM partner_invitations
            JOIN organizations ON organizations.id = partner_invitations.organization_id
            WHERE partner_invitations.id = partner_access.partner_invitation_id
            AND organizations.owner_id = auth.uid()
        )
    );

CREATE POLICY "Organization owners can insert partner access"
    ON partner_access
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM partner_invitations
            JOIN organizations ON organizations.id = partner_invitations.organization_id
            WHERE partner_invitations.id = partner_access.partner_invitation_id
            AND organizations.owner_id = auth.uid()
        )
    );

CREATE POLICY "Organization owners can update partner access"
    ON partner_access
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM partner_invitations
            JOIN organizations ON organizations.id = partner_invitations.organization_id
            WHERE partner_invitations.id = partner_access.partner_invitation_id
            AND organizations.owner_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM partner_invitations
            JOIN organizations ON organizations.id = partner_invitations.organization_id
            WHERE partner_invitations.id = partner_access.partner_invitation_id
            AND organizations.owner_id = auth.uid()
        )
    );

CREATE POLICY "Organization owners can delete partner access"
    ON partner_access
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM partner_invitations
            JOIN organizations ON organizations.id = partner_invitations.organization_id
            WHERE partner_invitations.id = partner_access.partner_invitation_id
            AND organizations.owner_id = auth.uid()
        )
    );

CREATE POLICY "Partners can view their own access"
    ON partner_access
    FOR SELECT
    USING (
        user_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM partner_invitations
            WHERE partner_invitations.id = partner_access.partner_invitation_id
            AND partner_invitations.invitation_key = current_setting('app.partner_key', true)::text
        )
    );

-- RLS Policies for organization_partner_settings
CREATE POLICY "Organization owners can select partner settings"
    ON organization_partner_settings
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM organizations
            WHERE organizations.id = organization_partner_settings.organization_id
            AND organizations.owner_id = auth.uid()
        )
    );

CREATE POLICY "Organization owners can insert partner settings"
    ON organization_partner_settings
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM organizations
            WHERE organizations.id = organization_partner_settings.organization_id
            AND organizations.owner_id = auth.uid()
        )
    );

CREATE POLICY "Organization owners can update partner settings"
    ON organization_partner_settings
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM organizations
            WHERE organizations.id = organization_partner_settings.organization_id
            AND organizations.owner_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM organizations
            WHERE organizations.id = organization_partner_settings.organization_id
            AND organizations.owner_id = auth.uid()
        )
    );

CREATE POLICY "Organization owners can delete partner settings"
    ON organization_partner_settings
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM organizations
            WHERE organizations.id = organization_partner_settings.organization_id
            AND organizations.owner_id = auth.uid()
        )
    );

CREATE POLICY "Partners can view their own settings"
    ON organization_partner_settings
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM partner_access
            JOIN partner_invitations ON partner_invitations.id = partner_access.partner_invitation_id
            WHERE partner_access.user_id = auth.uid()
            AND partner_invitations.id = organization_partner_settings.partner_invitation_id
        )
        OR EXISTS (
            SELECT 1 FROM partner_invitations
            WHERE partner_invitations.id = organization_partner_settings.partner_invitation_id
            AND partner_invitations.invitation_key = current_setting('app.partner_key', true)::text
        )
    );

-- Function to generate unique invitation key
CREATE OR REPLACE FUNCTION generate_partner_invitation_key()
RETURNS TEXT AS $$
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
        
        -- Check if key exists
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
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION generate_partner_invitation_key() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_partner_invitation_key() TO service_role;

