-- Fix RLS policy for contract_access_codes to allow reading access codes for validation
-- This allows external users to validate access codes without authentication

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Organization owners can manage access codes" ON contract_access_codes;

-- Create a new policy that allows organization owners to manage access codes
CREATE POLICY "Organization owners can manage access codes" ON contract_access_codes
    FOR ALL USING (
        contract_id IN (
            SELECT c.id FROM contracts c
            JOIN organizations o ON c.organization_id = o.id
            WHERE o.owner_id = auth.uid()
        )
    );

-- Create a new policy that allows reading access codes for validation (for external users)
CREATE POLICY "Allow reading access codes for validation" ON contract_access_codes
    FOR SELECT USING (true);

-- This policy allows anyone to read access codes, which is necessary for the sign-contract page
-- to validate access codes without requiring authentication
