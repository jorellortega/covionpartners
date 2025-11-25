-- Create revenue/income table for manual revenue entries
-- This allows users to manually track revenue that doesn't come from transactions

CREATE TABLE IF NOT EXISTS revenue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    category TEXT NOT NULL,
    source TEXT, -- e.g., "Sales", "Services", "Investment", "Other"
    payment_method TEXT, -- e.g., "Cash", "Bank Transfer", "Check", "Other"
    received_date DATE,
    notes TEXT,
    receipt_url TEXT,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_revenue_organization_id ON revenue(organization_id);
CREATE INDEX IF NOT EXISTS idx_revenue_user_id ON revenue(user_id);
CREATE INDEX IF NOT EXISTS idx_revenue_received_date ON revenue(received_date);
CREATE INDEX IF NOT EXISTS idx_revenue_created_at ON revenue(created_at);

-- Enable RLS
ALTER TABLE revenue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for revenue
CREATE POLICY "Organization owners can manage revenue"
    ON revenue
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM organizations
            WHERE organizations.id = revenue.organization_id
            AND organizations.owner_id = auth.uid()
        )
    );

CREATE POLICY "Organization staff with level 5 can view revenue"
    ON revenue
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM organization_staff
            WHERE organization_staff.organization_id = revenue.organization_id
            AND organization_staff.user_id = auth.uid()
            AND organization_staff.access_level = 5
        )
    );

CREATE POLICY "Users can view their own revenue entries"
    ON revenue
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can create revenue for their organizations"
    ON revenue
    FOR INSERT
    WITH CHECK (
        user_id = auth.uid() AND
        (
            EXISTS (
                SELECT 1 FROM organizations
                WHERE organizations.id = revenue.organization_id
                AND organizations.owner_id = auth.uid()
            )
            OR
            EXISTS (
                SELECT 1 FROM organization_staff
                WHERE organization_staff.organization_id = revenue.organization_id
                AND organization_staff.user_id = auth.uid()
                AND organization_staff.access_level = 5
            )
        )
    );

CREATE POLICY "Users can update their own revenue entries"
    ON revenue
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own revenue entries"
    ON revenue
    FOR DELETE
    USING (user_id = auth.uid());

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_revenue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_revenue_updated_at
    BEFORE UPDATE ON revenue
    FOR EACH ROW
    EXECUTE FUNCTION update_revenue_updated_at();

