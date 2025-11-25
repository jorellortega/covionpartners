-- Add financial visibility permissions to partner settings
-- This allows granular control over what financial information partners can see

ALTER TABLE organization_partner_settings
ADD COLUMN IF NOT EXISTS can_see_roi BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS can_see_balance BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS can_see_revenue BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS can_see_monthly_reports BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS can_receive_payments BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS can_send_payments BOOLEAN DEFAULT false;

-- Create table for partner financial reports (monthly reports sent to partners)
CREATE TABLE IF NOT EXISTS partner_financial_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    partner_invitation_id UUID NOT NULL REFERENCES partner_invitations(id) ON DELETE CASCADE,
    report_month DATE NOT NULL,
    report_type TEXT NOT NULL DEFAULT 'monthly' CHECK (report_type IN ('monthly', 'quarterly', 'annual', 'custom')),
    total_revenue DECIMAL(15,2) DEFAULT 0,
    total_expenses DECIMAL(15,2) DEFAULT 0,
    net_profit DECIMAL(15,2) DEFAULT 0,
    roi_percentage DECIMAL(10,4),
    balance DECIMAL(15,2) DEFAULT 0,
    report_data JSONB,
    sent_at TIMESTAMP WITH TIME ZONE,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(organization_id, partner_invitation_id, report_month, report_type)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_partner_financial_reports_org_id ON partner_financial_reports(organization_id);
CREATE INDEX IF NOT EXISTS idx_partner_financial_reports_invitation_id ON partner_financial_reports(partner_invitation_id);
CREATE INDEX IF NOT EXISTS idx_partner_financial_reports_month ON partner_financial_reports(report_month);

-- Enable RLS
ALTER TABLE partner_financial_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for partner_financial_reports
CREATE POLICY "Organization owners can manage financial reports"
    ON partner_financial_reports
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM organizations
            WHERE organizations.id = partner_financial_reports.organization_id
            AND organizations.owner_id = auth.uid()
        )
    );

CREATE POLICY "Partners can view their financial reports"
    ON partner_financial_reports
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM partner_access
            JOIN partner_invitations ON partner_invitations.id = partner_access.partner_invitation_id
            WHERE partner_access.user_id = auth.uid()
            AND partner_invitations.id = partner_financial_reports.partner_invitation_id
        )
    );

