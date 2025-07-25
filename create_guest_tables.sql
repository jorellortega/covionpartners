-- Create guest accounts system tables
-- Run this in your Supabase SQL editor

-- Create guest accounts table
CREATE TABLE IF NOT EXISTS guest_accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    guest_code TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    email TEXT, -- Optional email for notifications
    phone TEXT, -- Optional phone for notifications
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'frozen', 'dropped')),
    permissions JSONB DEFAULT '{}', -- Store permissions as JSON
    last_activity TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE, -- Optional expiration
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create organization guest codes table (for managing codes)
CREATE TABLE IF NOT EXISTS organization_guest_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL, -- Human readable name for the code
    description TEXT,
    max_uses INTEGER DEFAULT -1, -- -1 means unlimited
    current_uses INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    permissions JSONB DEFAULT '{}', -- Default permissions for guests using this code
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create guest activities table (for tracking guest actions)
CREATE TABLE IF NOT EXISTS guest_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    guest_account_id UUID NOT NULL REFERENCES guest_accounts(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL, -- 'upload', 'message', 'view', etc.
    resource_type TEXT, -- 'file', 'message', 'project', etc.
    resource_id UUID, -- ID of the resource accessed
    metadata JSONB DEFAULT '{}', -- Additional activity data
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_guest_accounts_organization_id ON guest_accounts(organization_id);
CREATE INDEX IF NOT EXISTS idx_guest_accounts_guest_code ON guest_accounts(guest_code);
CREATE INDEX IF NOT EXISTS idx_guest_accounts_status ON guest_accounts(status);
CREATE INDEX IF NOT EXISTS idx_guest_accounts_created_by ON guest_accounts(created_by);

CREATE INDEX IF NOT EXISTS idx_organization_guest_codes_organization_id ON organization_guest_codes(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_guest_codes_code ON organization_guest_codes(code);
CREATE INDEX IF NOT EXISTS idx_organization_guest_codes_is_active ON organization_guest_codes(is_active);

CREATE INDEX IF NOT EXISTS idx_guest_activities_guest_account_id ON guest_activities(guest_account_id);
CREATE INDEX IF NOT EXISTS idx_guest_activities_activity_type ON guest_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_guest_activities_created_at ON guest_activities(created_at);

-- Enable Row Level Security
ALTER TABLE guest_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_guest_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_activities ENABLE ROW LEVEL SECURITY;

-- Policies for guest_accounts
CREATE POLICY "Organization admins can manage guest accounts"
    ON guest_accounts
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM organizations
            WHERE organizations.id = guest_accounts.organization_id
            AND (
                organizations.owner_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM team_members
                    WHERE team_members.organization_id = organizations.id
                    AND team_members.user_id = auth.uid()
                    AND team_members.role = 'admin'
                )
            )
        )
    );

CREATE POLICY "Guests can view their own account"
    ON guest_accounts
    FOR SELECT
    USING (guest_code = current_setting('app.guest_code', true)::text);

-- Policies for organization_guest_codes
CREATE POLICY "Organization admins can manage guest codes"
    ON organization_guest_codes
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM organizations
            WHERE organizations.id = organization_guest_codes.organization_id
            AND (
                organizations.owner_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM team_members
                    WHERE team_members.organization_id = organizations.id
                    AND team_members.user_id = auth.uid()
                    AND team_members.role = 'admin'
                )
            )
        )
    );

CREATE POLICY "Anyone can view active guest codes"
    ON organization_guest_codes
    FOR SELECT
    USING (is_active = true);

-- Policies for guest_activities
CREATE POLICY "Organization admins can view guest activities"
    ON guest_activities
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM guest_accounts
            JOIN organizations ON organizations.id = guest_accounts.organization_id
            WHERE guest_accounts.id = guest_activities.guest_account_id
            AND (
                organizations.owner_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM team_members
                    WHERE team_members.organization_id = organizations.id
                    AND team_members.user_id = auth.uid()
                    AND team_members.role = 'admin'
                )
            )
        )
    );

CREATE POLICY "Guests can insert their own activities"
    ON guest_activities
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM guest_accounts
            WHERE guest_accounts.id = guest_activities.guest_account_id
            AND guest_accounts.guest_code = current_setting('app.guest_code', true)::text
        )
    );

-- Create function to update updated_at timestamp (if it doesn't exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_guest_accounts_updated_at
    BEFORE UPDATE ON guest_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organization_guest_codes_updated_at
    BEFORE UPDATE ON organization_guest_codes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 