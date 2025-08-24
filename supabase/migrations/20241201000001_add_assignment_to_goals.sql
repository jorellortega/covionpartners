-- Add assignment fields to organization_goals table
ALTER TABLE organization_goals 
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES organization_staff(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS assigned_by UUID REFERENCES organization_staff(id) ON DELETE SET NULL;

-- Create indexes for assignment fields
CREATE INDEX IF NOT EXISTS idx_organization_goals_assigned_to ON organization_goals(assigned_to);
CREATE INDEX IF NOT EXISTS idx_organization_goals_assigned_by ON organization_goals(assigned_by);

-- Add comments
COMMENT ON COLUMN organization_goals.assigned_to IS 'Staff member assigned to this goal';
COMMENT ON COLUMN organization_goals.assigned_by IS 'Staff member who assigned this goal';
