-- Create balance_sheet_items table for tracking assets and liabilities
-- This allows users to track their organization's financial position

CREATE TABLE IF NOT EXISTS balance_sheet_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    item_type TEXT NOT NULL CHECK (item_type IN ('asset', 'liability')),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    description TEXT,
    date_acquired DATE,
    notes TEXT,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_balance_sheet_organization_id ON balance_sheet_items(organization_id);
CREATE INDEX IF NOT EXISTS idx_balance_sheet_user_id ON balance_sheet_items(user_id);
CREATE INDEX IF NOT EXISTS idx_balance_sheet_item_type ON balance_sheet_items(item_type);
CREATE INDEX IF NOT EXISTS idx_balance_sheet_created_at ON balance_sheet_items(created_at);

-- Enable RLS
ALTER TABLE balance_sheet_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for balance_sheet_items
CREATE POLICY "Organization owners can manage balance sheet items"
    ON balance_sheet_items
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM organizations
            WHERE organizations.id = balance_sheet_items.organization_id
            AND organizations.owner_id = auth.uid()
        )
    );

CREATE POLICY "Organization staff with level 5 can view balance sheet items"
    ON balance_sheet_items
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM organization_staff
            WHERE organization_staff.organization_id = balance_sheet_items.organization_id
            AND organization_staff.user_id = auth.uid()
            AND organization_staff.access_level = 5
        )
    );

CREATE POLICY "Users can view their own balance sheet items"
    ON balance_sheet_items
    FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can create balance sheet items for their organizations"
    ON balance_sheet_items
    FOR INSERT
    WITH CHECK (
        user_id = auth.uid() AND
        (
            EXISTS (
                SELECT 1 FROM organizations
                WHERE organizations.id = balance_sheet_items.organization_id
                AND organizations.owner_id = auth.uid()
            )
            OR
            EXISTS (
                SELECT 1 FROM organization_staff
                WHERE organization_staff.organization_id = balance_sheet_items.organization_id
                AND organization_staff.user_id = auth.uid()
                AND organization_staff.access_level = 5
            )
        )
    );

CREATE POLICY "Users can update their own balance sheet items"
    ON balance_sheet_items
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own balance sheet items"
    ON balance_sheet_items
    FOR DELETE
    USING (user_id = auth.uid());

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_balance_sheet_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_balance_sheet_updated_at
    BEFORE UPDATE ON balance_sheet_items
    FOR EACH ROW
    EXECUTE FUNCTION update_balance_sheet_updated_at();

