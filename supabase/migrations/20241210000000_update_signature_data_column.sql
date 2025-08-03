-- Update signature_data column to handle larger base64 image data
-- Migration: 20241210000000_update_signature_data_column.sql

-- Update the signature_data column to use LONGTEXT or increase size for base64 image data
ALTER TABLE contract_signatures 
ALTER COLUMN signature_data TYPE TEXT;

-- Add a comment to clarify the column usage
COMMENT ON COLUMN contract_signatures.signature_data IS 'Base64 encoded signature image data (PNG format)';

-- Add an index for better performance when querying signatures
CREATE INDEX IF NOT EXISTS idx_contract_signatures_signature_data ON contract_signatures(contract_id, signed_at);

-- Update RLS policies to allow signature data access
CREATE POLICY "Users can view signatures from their organization contracts" ON contract_signatures
    FOR SELECT USING (
        contract_id IN (
            SELECT c.id FROM contracts c
            JOIN team_members tm ON c.organization_id = tm.organization_id
            WHERE tm.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create signatures for accessible contracts" ON contract_signatures
    FOR INSERT WITH CHECK (
        contract_id IN (
            SELECT c.id FROM contracts c
            JOIN team_members tm ON c.organization_id = tm.organization_id
            WHERE tm.user_id = auth.uid()
        )
        OR
        contract_id IN (
            SELECT contract_id FROM contract_access_codes
            WHERE access_code = current_setting('app.current_access_code', true)::text
        )
    ); 