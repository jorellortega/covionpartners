-- Add investment tracking to partner invitations
-- This allows tracking how much each partner invested and their share percentage for ROI calculations

ALTER TABLE partner_invitations
ADD COLUMN IF NOT EXISTS investment_amount DECIMAL(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS share_percentage DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS investment_date DATE,
ADD COLUMN IF NOT EXISTS investment_notes TEXT;

-- Add comment for documentation
COMMENT ON COLUMN partner_invitations.investment_amount IS 'Amount invested by this partner';
COMMENT ON COLUMN partner_invitations.share_percentage IS 'Percentage share of the organization/profit (0-100)';
COMMENT ON COLUMN partner_invitations.investment_date IS 'Date when the investment was made';
COMMENT ON COLUMN partner_invitations.investment_notes IS 'Notes about the investment agreement';

-- Add check constraint for share_percentage
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'valid_share_percentage' 
        AND conrelid = 'partner_invitations'::regclass
    ) THEN
        ALTER TABLE partner_invitations
        ADD CONSTRAINT valid_share_percentage 
        CHECK (share_percentage >= 0 AND share_percentage <= 100);
    END IF;
END $$;

-- Update partner_financial_reports to include partner-specific ROI
ALTER TABLE partner_financial_reports
ADD COLUMN IF NOT EXISTS partner_investment_amount DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS partner_share_percentage DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS partner_roi_percentage DECIMAL(10,4),
ADD COLUMN IF NOT EXISTS partner_profit_share DECIMAL(15,2);

-- Add comments
COMMENT ON COLUMN partner_financial_reports.partner_investment_amount IS 'The investment amount for this specific partner';
COMMENT ON COLUMN partner_financial_reports.partner_share_percentage IS 'The share percentage for this specific partner';
COMMENT ON COLUMN partner_financial_reports.partner_roi_percentage IS 'ROI percentage calculated specifically for this partner based on their investment';
COMMENT ON COLUMN partner_financial_reports.partner_profit_share IS 'Profit share amount for this partner based on their share percentage';

