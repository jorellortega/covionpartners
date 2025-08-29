-- Fix contract_signatures table RLS policy to allow external users to insert signatures
-- This is needed for the multi-signer functionality to work properly

-- Drop any existing restrictive policies
DROP POLICY IF EXISTS "Users can sign contracts they have access to" ON contract_signatures;
DROP POLICY IF EXISTS "Users can view signatures for contracts in their organizations" ON contract_signatures;

-- Create a policy that allows anyone to insert signatures (for external users with access codes)
CREATE POLICY "Allow public signature creation" ON contract_signatures
    FOR INSERT WITH CHECK (true);

-- Create a policy that allows viewing signatures for accessible contracts
CREATE POLICY "Allow signature viewing for accessible contracts" ON contract_signatures
    FOR SELECT USING (
        contract_id IN (
            SELECT c.id FROM contracts c
            LEFT JOIN team_members tm ON c.organization_id = tm.organization_id
            WHERE tm.user_id = auth.uid() 
               OR c.created_by = auth.uid()
               OR c.organization_id IN (
                   SELECT id FROM organizations WHERE owner_id = auth.uid()
               )
            -- Also allow access for contracts with valid access codes
            OR contract_id IN (
                SELECT contract_id FROM contract_access_codes
                WHERE access_code = current_setting('app.access_code', true)::text
            )
        )
    );

-- Ensure RLS is enabled
ALTER TABLE contract_signatures ENABLE ROW LEVEL SECURITY;
