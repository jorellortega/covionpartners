-- Create contract library system tables
-- Migration: 20241209000003_create_contract_library_system.sql

-- Contract templates table (for storing reusable contract text)
CREATE TABLE IF NOT EXISTS contract_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'general',
    contract_text TEXT NOT NULL,
    variables JSONB DEFAULT '[]'::jsonb, -- Store variable placeholders like {{user_name}}, {{date}}, etc.
    is_public BOOLEAN DEFAULT false,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Contracts table (actual contracts created from templates or uploaded)
CREATE TABLE IF NOT EXISTS contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    template_id UUID REFERENCES contract_templates(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    contract_text TEXT NOT NULL,
    file_url TEXT, -- For uploaded PDFs/DOCs
    file_name TEXT,
    file_type TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'sent', 'signed', 'expired', 'cancelled')),
    category TEXT NOT NULL DEFAULT 'general',
    variables JSONB DEFAULT '{}'::jsonb, -- Filled variables like {"user_name": "John Doe", "date": "2024-01-01"}
    expires_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Contract signatures table
CREATE TABLE IF NOT EXISTS contract_signatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
    signer_name TEXT NOT NULL,
    signer_email TEXT,
    signer_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    signature_data TEXT, -- Base64 encoded signature or signature hash
    signed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    ip_address TEXT,
    user_agent TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'signed', 'declined')),
    notes TEXT
);

-- Contract access codes table (for public access without authentication)
CREATE TABLE IF NOT EXISTS contract_access_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID REFERENCES contracts(id) ON DELETE CASCADE,
    access_code TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE,
    max_uses INTEGER DEFAULT 1,
    current_uses INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contract_templates_organization ON contract_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_contract_templates_category ON contract_templates(category);
CREATE INDEX IF NOT EXISTS idx_contracts_organization ON contracts(organization_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_category ON contracts(category);
CREATE INDEX IF NOT EXISTS idx_contract_signatures_contract ON contract_signatures(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_signatures_signer ON contract_signatures(signer_email);
CREATE INDEX IF NOT EXISTS idx_contract_access_codes_contract ON contract_access_codes(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_access_codes_code ON contract_access_codes(access_code);

-- Row Level Security (RLS) Policies

-- Contract templates policies
ALTER TABLE contract_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view templates from their organizations" ON contract_templates
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM team_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Organization owners can manage templates" ON contract_templates
    FOR ALL USING (
        organization_id IN (
            SELECT id FROM organizations 
            WHERE owner_id = auth.uid()
        )
    );

-- Contracts policies
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view contracts from their organizations" ON contracts
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM team_members 
            WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Organization owners can manage contracts" ON contracts
    FOR ALL USING (
        organization_id IN (
            SELECT id FROM organizations 
            WHERE owner_id = auth.uid()
        )
    );

-- Contract signatures policies
ALTER TABLE contract_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view signatures for contracts in their organizations" ON contract_signatures
    FOR SELECT USING (
        contract_id IN (
            SELECT c.id FROM contracts c
            JOIN team_members tm ON c.organization_id = tm.organization_id
            WHERE tm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can sign contracts they have access to" ON contract_signatures
    FOR INSERT WITH CHECK (
        contract_id IN (
            SELECT c.id FROM contracts c
            JOIN team_members tm ON c.organization_id = tm.organization_id
            WHERE tm.user_id = auth.uid()
        )
        OR
        contract_id IN (
            SELECT contract_id FROM contract_access_codes
            WHERE access_code = current_setting('app.access_code', true)::text
        )
    );

-- Contract access codes policies
ALTER TABLE contract_access_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Organization owners can manage access codes" ON contract_access_codes
    FOR ALL USING (
        contract_id IN (
            SELECT c.id FROM contracts c
            JOIN organizations o ON c.organization_id = o.id
            WHERE o.owner_id = auth.uid()
        )
    );

-- Helper function to generate access codes
CREATE OR REPLACE FUNCTION generate_contract_access_code()
RETURNS TEXT AS $$
DECLARE
    generated_code TEXT;
    attempts INTEGER := 0;
    max_attempts INTEGER := 10;
BEGIN
    LOOP
        -- Generate a 8-character alphanumeric code
        generated_code := upper(substring(md5(random()::text) from 1 for 8));
        
        -- Check if code already exists
        IF NOT EXISTS (SELECT 1 FROM contract_access_codes WHERE access_code = generated_code) THEN
            RETURN generated_code;
        END IF;
        
        attempts := attempts + 1;
        IF attempts >= max_attempts THEN
            RAISE EXCEPTION 'Unable to generate unique access code after % attempts', max_attempts;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION generate_contract_access_code() TO authenticated;
GRANT EXECUTE ON FUNCTION generate_contract_access_code() TO service_role;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_contract_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_contract_templates_updated_at
    BEFORE UPDATE ON contract_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_contract_updated_at();

CREATE TRIGGER update_contracts_updated_at
    BEFORE UPDATE ON contracts
    FOR EACH ROW
    EXECUTE FUNCTION update_contract_updated_at(); 