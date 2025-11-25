-- Add Stripe Connect onboarding tracking to partner invitations
-- This tracks whether partners have completed Stripe Connect onboarding to receive payments

ALTER TABLE partner_invitations
ADD COLUMN IF NOT EXISTS stripe_connect_onboarding_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS stripe_connect_account_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_connect_onboarding_url TEXT;

-- Add comments for documentation
COMMENT ON COLUMN partner_invitations.stripe_connect_onboarding_completed IS 'Whether the partner has completed Stripe Connect onboarding';
COMMENT ON COLUMN partner_invitations.stripe_connect_account_id IS 'Stripe Connect account ID for this partner';
COMMENT ON COLUMN partner_invitations.stripe_connect_onboarding_url IS 'Stripe Connect onboarding URL for this partner';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_partner_invitations_stripe_onboarding 
ON partner_invitations(stripe_connect_onboarding_completed) 
WHERE stripe_connect_onboarding_completed = true;

