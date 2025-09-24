-- Add goal_type column to organization_goals table
ALTER TABLE organization_goals 
ADD COLUMN IF NOT EXISTS goal_type TEXT NOT NULL DEFAULT 'yearly' 
CHECK (goal_type IN ('weekly', 'monthly', 'yearly'));

-- Add assigned_to column to organization_goals table if it doesn't exist
ALTER TABLE organization_goals 
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES organization_staff(id) ON DELETE SET NULL;

-- Create index for goal_type for better query performance
CREATE INDEX IF NOT EXISTS idx_organization_goals_goal_type ON organization_goals(goal_type);

-- Add comment for the new column
COMMENT ON COLUMN organization_goals.goal_type IS 'Time period for the goal (weekly, monthly, yearly)';
COMMENT ON COLUMN organization_goals.assigned_to IS 'Staff member assigned to this goal';
