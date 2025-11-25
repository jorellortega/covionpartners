-- Create table for partner withdrawal requests
-- Partners can request to withdraw their profit share, and organization owners can approve/process them

CREATE TABLE IF NOT EXISTS partner_withdrawal_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    partner_invitation_id UUID NOT NULL REFERENCES partner_invitations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'processing', 'completed', 'rejected', 'cancelled')),
    request_type TEXT NOT NULL DEFAULT 'profit_share' CHECK (request_type IN ('profit_share', 'custom', 'refund')),
    financial_report_id UUID REFERENCES partner_financial_reports(id) ON DELETE SET NULL,
    notes TEXT,
    rejection_reason TEXT,
    stripe_transfer_id TEXT,
    processed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_partner_withdrawal_requests_org_id ON partner_withdrawal_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_partner_withdrawal_requests_invitation_id ON partner_withdrawal_requests(partner_invitation_id);
CREATE INDEX IF NOT EXISTS idx_partner_withdrawal_requests_user_id ON partner_withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_partner_withdrawal_requests_status ON partner_withdrawal_requests(status);
CREATE INDEX IF NOT EXISTS idx_partner_withdrawal_requests_created_at ON partner_withdrawal_requests(created_at);

-- Add comments
COMMENT ON TABLE partner_withdrawal_requests IS 'Tracks withdrawal requests from partners for their profit share';
COMMENT ON COLUMN partner_withdrawal_requests.amount IS 'Amount requested to withdraw (must be positive)';
COMMENT ON COLUMN partner_withdrawal_requests.status IS 'Status of the withdrawal request';
COMMENT ON COLUMN partner_withdrawal_requests.request_type IS 'Type of withdrawal request';
COMMENT ON COLUMN partner_withdrawal_requests.financial_report_id IS 'Optional link to the financial report this withdrawal is based on';
COMMENT ON COLUMN partner_withdrawal_requests.stripe_transfer_id IS 'Stripe transfer ID when the withdrawal is processed';

-- Enable RLS
ALTER TABLE partner_withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Partners can view their own withdrawal requests
CREATE POLICY "Partners can view their own withdrawal requests"
    ON partner_withdrawal_requests
    FOR SELECT
    USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM organizations
            WHERE organizations.id = partner_withdrawal_requests.organization_id
            AND organizations.owner_id = auth.uid()
        )
    );

-- Partners can create withdrawal requests for themselves
CREATE POLICY "Partners can create withdrawal requests"
    ON partner_withdrawal_requests
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM partner_invitations
            WHERE partner_invitations.id = partner_withdrawal_requests.partner_invitation_id
            AND partner_invitations.status = 'accepted'
            AND EXISTS (
                SELECT 1 FROM partner_access
                WHERE partner_access.partner_invitation_id = partner_invitations.id
                AND partner_access.user_id = auth.uid()
            )
        )
    );

-- Organization owners can update withdrawal requests (approve/reject/process)
CREATE POLICY "Organization owners can update withdrawal requests"
    ON partner_withdrawal_requests
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM organizations
            WHERE organizations.id = partner_withdrawal_requests.organization_id
            AND organizations.owner_id = auth.uid()
        )
    );

-- Partners can update their own pending requests (cancel)
CREATE POLICY "Partners can cancel their own pending requests"
    ON partner_withdrawal_requests
    FOR UPDATE
    USING (
        auth.uid() = user_id AND
        status = 'pending'
    )
    WITH CHECK (
        auth.uid() = user_id AND
        (status = 'cancelled' OR status = 'pending')
    );

