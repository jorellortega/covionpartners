-- Add investment type and partnership type to partner invitations
-- This allows categorizing the type of investment and partnership relationship

ALTER TABLE partner_invitations
ADD COLUMN IF NOT EXISTS investment_type TEXT DEFAULT 'equity',
ADD COLUMN IF NOT EXISTS partnership_type TEXT;

-- Add check constraint for investment_type
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'valid_partner_investment_type' 
        AND conrelid = 'partner_invitations'::regclass
    ) THEN
        ALTER TABLE partner_invitations
        ADD CONSTRAINT valid_partner_investment_type 
        CHECK (investment_type IN ('equity', 'debt', 'revenue_share', 'convertible_note', 'safes', 'donation', 'other'));
    END IF;
END $$;

-- Add check constraint for partnership_type
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'valid_partnership_type' 
        AND conrelid = 'partner_invitations'::regclass
    ) THEN
        ALTER TABLE partner_invitations
        ADD CONSTRAINT valid_partnership_type 
        CHECK (partnership_type IN ('strategic', 'financial', 'operational', 'advisory', 'joint_venture', 'joint_partner', 'silent_partner', 'distribution', 'technology', 'marketing', 'other') OR partnership_type IS NULL);
    END IF;
END $$;

-- Add comments
COMMENT ON COLUMN partner_invitations.investment_type IS 'Type of investment: equity, debt, revenue_share, convertible_note, safes, donation, or other';
COMMENT ON COLUMN partner_invitations.partnership_type IS 'Type of partnership: strategic, financial, operational, advisory, joint_venture, joint_partner, silent_partner, distribution, technology, marketing, or other';

