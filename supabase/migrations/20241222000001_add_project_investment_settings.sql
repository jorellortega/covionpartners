-- Add investment settings columns to projects table
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS min_investment numeric(10,2),
ADD COLUMN IF NOT EXISTS max_investment numeric(10,2),
ADD COLUMN IF NOT EXISTS investment_start timestamp with time zone,
ADD COLUMN IF NOT EXISTS investment_end timestamp with time zone,
ADD COLUMN IF NOT EXISTS payment_methods text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS investment_type text DEFAULT 'equity',
ADD COLUMN IF NOT EXISTS investment_pitch text,
ADD COLUMN IF NOT EXISTS investment_terms text,
ADD COLUMN IF NOT EXISTS auto_approve_investments boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS max_investors integer,
ADD COLUMN IF NOT EXISTS enable_waitlist boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS investment_perks text,
ADD COLUMN IF NOT EXISTS country_restrictions text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS accredited_only boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS investment_contact_email text,
ADD COLUMN IF NOT EXISTS allow_public_investments boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS allow_investor_investments boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS investment_terms_file_url text;

-- Add check constraint for investment_type
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'valid_investment_type' 
        AND conrelid = 'projects'::regclass
    ) THEN
        ALTER TABLE projects
        ADD CONSTRAINT valid_investment_type 
        CHECK (investment_type IN ('equity', 'debt', 'revenue_share', 'donation'));
    END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN projects.min_investment IS 'Minimum investment amount allowed';
COMMENT ON COLUMN projects.max_investment IS 'Maximum investment amount allowed';
COMMENT ON COLUMN projects.investment_start IS 'Start date for accepting investments';
COMMENT ON COLUMN projects.investment_end IS 'End date for accepting investments';
COMMENT ON COLUMN projects.payment_methods IS 'Array of accepted payment methods';
COMMENT ON COLUMN projects.investment_type IS 'Type of investment (equity, debt, revenue_share, donation)';
COMMENT ON COLUMN projects.investment_pitch IS 'Pitch description for investors';
COMMENT ON COLUMN projects.investment_terms IS 'Custom terms and conditions for investments';
COMMENT ON COLUMN projects.auto_approve_investments IS 'Whether to auto-approve investment requests';
COMMENT ON COLUMN projects.max_investors IS 'Maximum number of investors allowed';
COMMENT ON COLUMN projects.enable_waitlist IS 'Whether to enable waitlist when max investors reached';
COMMENT ON COLUMN projects.investment_perks IS 'Perks or rewards for investors';
COMMENT ON COLUMN projects.country_restrictions IS 'Array of countries restricted from investing';
COMMENT ON COLUMN projects.accredited_only IS 'Whether only accredited investors are allowed';
COMMENT ON COLUMN projects.investment_contact_email IS 'Contact email for investment inquiries';
COMMENT ON COLUMN projects.allow_public_investments IS 'Whether to allow public (non-investor) investments';
COMMENT ON COLUMN projects.allow_investor_investments IS 'Whether to allow registered investor investments';
COMMENT ON COLUMN projects.investment_terms_file_url IS 'URL to uploaded terms and conditions file';

