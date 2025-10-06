-- Create organization_goal_subtasks table
CREATE TABLE IF NOT EXISTS organization_goal_subtasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    goal_id UUID NOT NULL REFERENCES organization_goals(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    assigned_to UUID REFERENCES organization_staff(id) ON DELETE SET NULL,
    due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_goal_subtasks_goal_id ON organization_goal_subtasks(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_subtasks_status ON organization_goal_subtasks(status);
CREATE INDEX IF NOT EXISTS idx_goal_subtasks_assigned_to ON organization_goal_subtasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_goal_subtasks_created_by ON organization_goal_subtasks(created_by);

-- Add RLS policies
ALTER TABLE organization_goal_subtasks ENABLE ROW LEVEL SECURITY;

-- Policy for viewing subtasks (users can view subtasks for goals in organizations they have access to)
CREATE POLICY "Users can view subtasks for accessible goals" ON organization_goal_subtasks
    FOR SELECT USING (
        goal_id IN (
            SELECT og.id 
            FROM organization_goals og
            LEFT JOIN organization_staff os ON og.organization_id = os.organization_id
            WHERE os.user_id = auth.uid() OR og.organization_id IN (
                SELECT id FROM organizations WHERE owner_id = auth.uid()
            )
        )
    );

-- Policy for inserting subtasks (users can create subtasks for goals they can access)
CREATE POLICY "Users can create subtasks for accessible goals" ON organization_goal_subtasks
    FOR INSERT WITH CHECK (
        created_by = auth.uid() AND
        goal_id IN (
            SELECT og.id 
            FROM organization_goals og
            LEFT JOIN organization_staff os ON og.organization_id = os.organization_id
            WHERE os.user_id = auth.uid() OR og.organization_id IN (
                SELECT id FROM organizations WHERE owner_id = auth.uid()
            )
        )
    );

-- Policy for updating subtasks (users can update subtasks they created or are assigned to)
CREATE POLICY "Users can update their subtasks" ON organization_goal_subtasks
    FOR UPDATE USING (
        created_by = auth.uid() OR 
        assigned_to IN (
            SELECT id FROM organization_staff WHERE user_id = auth.uid()
        )
    );

-- Policy for deleting subtasks (users can delete subtasks they created)
CREATE POLICY "Users can delete their subtasks" ON organization_goal_subtasks
    FOR DELETE USING (created_by = auth.uid());

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_goal_subtasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_goal_subtasks_updated_at
    BEFORE UPDATE ON organization_goal_subtasks
    FOR EACH ROW
    EXECUTE FUNCTION update_goal_subtasks_updated_at();

-- Add completion tracking to organization_goals table
ALTER TABLE organization_goals 
ADD COLUMN IF NOT EXISTS subtasks_completed INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS subtasks_total INTEGER DEFAULT 0;

-- Create function to update goal completion stats
CREATE OR REPLACE FUNCTION update_goal_subtask_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the goal's subtask statistics
    UPDATE organization_goals 
    SET 
        subtasks_total = (
            SELECT COUNT(*) 
            FROM organization_goal_subtasks 
            WHERE goal_id = COALESCE(NEW.goal_id, OLD.goal_id)
        ),
        subtasks_completed = (
            SELECT COUNT(*) 
            FROM organization_goal_subtasks 
            WHERE goal_id = COALESCE(NEW.goal_id, OLD.goal_id)
            AND status = 'completed'
        )
    WHERE id = COALESCE(NEW.goal_id, OLD.goal_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers to update goal stats when subtasks change
CREATE TRIGGER update_goal_stats_on_subtask_insert
    AFTER INSERT ON organization_goal_subtasks
    FOR EACH ROW
    EXECUTE FUNCTION update_goal_subtask_stats();

CREATE TRIGGER update_goal_stats_on_subtask_update
    AFTER UPDATE ON organization_goal_subtasks
    FOR EACH ROW
    EXECUTE FUNCTION update_goal_subtask_stats();

CREATE TRIGGER update_goal_stats_on_subtask_delete
    AFTER DELETE ON organization_goal_subtasks
    FOR EACH ROW
    EXECUTE FUNCTION update_goal_subtask_stats();

-- Update existing goals to have correct subtask counts
UPDATE organization_goals 
SET 
    subtasks_total = 0,
    subtasks_completed = 0
WHERE subtasks_total IS NULL OR subtasks_completed IS NULL;
