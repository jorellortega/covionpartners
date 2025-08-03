-- Fix RLS policies for contract_signatures table
-- Migration: 20241210000001_fix_contract_signatures_rls.sql

-- Drop existing conflicting policies
DROP POLICY IF EXISTS "Users can create signatures for accessible contracts" ON contract_signatures;
DROP POLICY IF EXISTS "Users can sign contracts they have access to" ON contract_signatures;
DROP POLICY IF EXISTS "Users can view signatures for contracts in their organizations" ON contract_signatures;
DROP POLICY IF EXISTS "Users can view signatures from their organization contracts" ON contract_signatures;

-- Create simplified policies that work for both authenticated and anonymous users
-- Allow INSERT for anyone (for public signing via access codes)
CREATE POLICY "Allow signature creation" ON contract_signatures
    FOR INSERT WITH CHECK (true);

-- Allow SELECT for organization members and contract creators
CREATE POLICY "Allow signature viewing" ON contract_signatures
    FOR SELECT USING (
        contract_id IN (
            SELECT c.id FROM contracts c
            LEFT JOIN team_members tm ON c.organization_id = tm.organization_id
            WHERE tm.user_id = auth.uid() 
               OR c.created_by = auth.uid()
               OR c.organization_id IN (
                   SELECT id FROM organizations WHERE owner_id = auth.uid()
               )
        )
    );

-- Allow UPDATE for signature owners and contract creators
CREATE POLICY "Allow signature updates" ON contract_signatures
    FOR UPDATE USING (
        signer_user_id = auth.uid() 
        OR contract_id IN (
            SELECT id FROM contracts WHERE created_by = auth.uid()
        )
    );

-- Enable RLS
ALTER TABLE contract_signatures ENABLE ROW LEVEL SECURITY; 