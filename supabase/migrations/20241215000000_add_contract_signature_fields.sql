-- Add contract signature fields support
-- Migration: 20241215000000_add_contract_signature_fields.sql

-- Add signature_fields column to contracts table to store field definitions
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS signature_fields JSONB DEFAULT '[]'::jsonb;

-- Add comment to explain the signature_fields structure
COMMENT ON COLUMN contracts.signature_fields IS 'Array of signature field definitions. Each field has: type (signature, name, date, email, text), label, placeholder, required, position (page, x, y), and placeholder_text in contract';

-- Add signature_field_values column to contract_signatures table to store filled values
ALTER TABLE contract_signatures 
ADD COLUMN IF NOT EXISTS signature_field_values JSONB DEFAULT '{}'::jsonb;

-- Add comment to explain the signature_field_values structure
COMMENT ON COLUMN contract_signatures.signature_field_values IS 'Object containing filled values for signature fields. Keys match field IDs from contract.signature_fields';

-- Create index for better performance when querying by signature fields
CREATE INDEX IF NOT EXISTS idx_contracts_signature_fields ON contracts USING GIN (signature_fields);
CREATE INDEX IF NOT EXISTS idx_contract_signatures_field_values ON contract_signatures USING GIN (signature_field_values);

-- Example signature_fields structure:
-- [
--   {
--     "id": "signer_name_1",
--     "type": "name",
--     "label": "Signer Name",
--     "placeholder": "{{signer_name_1}}",
--     "required": true,
--     "position": {"page": 1, "x": 100, "y": 200},
--     "placeholder_text": "_____________"
--   },
--   {
--     "id": "signature_1", 
--     "type": "signature",
--     "label": "Signature",
--     "placeholder": "{{signature_1}}",
--     "required": true,
--     "position": {"page": 1, "x": 150, "y": 250},
--     "placeholder_text": "_____________"
--   },
--   {
--     "id": "date_1",
--     "type": "date", 
--     "label": "Date",
--     "placeholder": "{{date_1}}",
--     "required": true,
--     "position": {"page": 1, "x": 200, "y": 300},
--     "placeholder_text": "_____________"
--   }
-- ]

-- Example signature_field_values structure:
-- {
--   "signer_name_1": "John Doe",
--   "signature_1": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
--   "date_1": "2024-12-15"
-- } 