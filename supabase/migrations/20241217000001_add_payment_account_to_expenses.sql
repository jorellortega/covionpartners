-- Add payment account and other missing columns to expenses table
-- This migration adds support for bank account/card information and organization-level expenses

-- Add organization_id column if it doesn't exist
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Add payment account column for bank account/card information
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS payment_account TEXT;

-- Add recurring expense columns if they don't exist
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE;

ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS recurrence VARCHAR(32);

ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS next_payment_date DATE;

ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE;

-- Update status check constraint to include new status values
ALTER TABLE expenses 
DROP CONSTRAINT IF EXISTS expenses_status_check;

ALTER TABLE expenses 
ADD CONSTRAINT expenses_status_check 
CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Paid', 'Unpaid', 'Overdue', 'Partially Paid'));

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_expenses_organization_id ON expenses(organization_id);
CREATE INDEX IF NOT EXISTS idx_expenses_payment_account ON expenses(payment_account);
CREATE INDEX IF NOT EXISTS idx_expenses_is_recurring ON expenses(is_recurring);

-- Update RLS policies to support organization-level access
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view expenses for their projects" ON expenses;
DROP POLICY IF EXISTS "Users can create expenses for their projects" ON expenses;
DROP POLICY IF EXISTS "Users can update their own expenses" ON expenses;
DROP POLICY IF EXISTS "Users can delete their own expenses" ON expenses;

-- Create new policies that support both project and organization level access
CREATE POLICY "Users can view expenses for their projects or organizations"
    ON expenses FOR SELECT
    USING (
        -- Project-based access
        EXISTS (
            SELECT 1 FROM team_members
            WHERE team_members.project_id = expenses.project_id
            AND team_members.user_id = auth.uid()
        )
        OR
        -- Organization-based access (owner or staff with level 5)
        (
            expenses.organization_id IS NOT NULL AND
            (
                EXISTS (
                    SELECT 1 FROM organizations
                    WHERE organizations.id = expenses.organization_id
                    AND organizations.owner_id = auth.uid()
                )
                OR
                EXISTS (
                    SELECT 1 FROM organization_staff
                    WHERE organization_staff.organization_id = expenses.organization_id
                    AND organization_staff.user_id = auth.uid()
                    AND organization_staff.access_level = 5
                )
            )
        )
    );

CREATE POLICY "Users can create expenses for their projects or organizations"
    ON expenses FOR INSERT
    WITH CHECK (
        -- Project-based access
        (
            project_id IS NOT NULL AND
            EXISTS (
                SELECT 1 FROM team_members
                WHERE team_members.project_id = expenses.project_id
                AND team_members.user_id = auth.uid()
            )
        )
        OR
        -- Organization-based access (owner or staff with level 5)
        (
            organization_id IS NOT NULL AND
            (
                EXISTS (
                    SELECT 1 FROM organizations
                    WHERE organizations.id = expenses.organization_id
                    AND organizations.owner_id = auth.uid()
                )
                OR
                EXISTS (
                    SELECT 1 FROM organization_staff
                    WHERE organization_staff.organization_id = expenses.organization_id
                    AND organization_staff.user_id = auth.uid()
                    AND organization_staff.access_level = 5
                )
            )
        )
    );

CREATE POLICY "Users can update their own expenses"
    ON expenses FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own expenses"
    ON expenses FOR DELETE
    USING (user_id = auth.uid());

-- Add comments to document the new columns
COMMENT ON COLUMN expenses.organization_id IS 'Organization this expense belongs to (for organization-level expenses)';
COMMENT ON COLUMN expenses.payment_account IS 'Bank account or card information used for this expense';
COMMENT ON COLUMN expenses.is_recurring IS 'Whether this is a recurring expense';
COMMENT ON COLUMN expenses.recurrence IS 'Recurrence pattern (Monthly, Yearly, Quarterly, One-time)';
COMMENT ON COLUMN expenses.next_payment_date IS 'Next payment date for recurring expenses';
COMMENT ON COLUMN expenses.verified IS 'Whether this expense has been verified';
