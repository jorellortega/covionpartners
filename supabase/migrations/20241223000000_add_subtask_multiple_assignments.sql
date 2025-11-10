-- Add support for multiple assignments to goal subtasks
-- This migration creates a junction table for many-to-many relationships

-- Create organization_goal_subtask_assignments table for multiple subtask assignments
CREATE TABLE IF NOT EXISTS organization_goal_subtask_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    subtask_id UUID NOT NULL REFERENCES organization_goal_subtasks(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES organization_staff(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES organization_staff(id) ON DELETE SET NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(subtask_id, staff_id)
);

-- Create indexes for better performance
CREATE INDEX idx_subtask_assignments_subtask_id ON organization_goal_subtask_assignments(subtask_id);
CREATE INDEX idx_subtask_assignments_staff_id ON organization_goal_subtask_assignments(staff_id);
CREATE INDEX idx_subtask_assignments_status ON organization_goal_subtask_assignments(status);

-- Migrate existing single assignments to the new junction table
-- First insert with assigned_by set to NULL, then update it
INSERT INTO organization_goal_subtask_assignments (subtask_id, staff_id, assigned_by, status)
SELECT 
    ogs.id as subtask_id,
    ogs.assigned_to as staff_id,
    NULL as assigned_by, -- Will be updated below
    CASE 
        WHEN ogs.status = 'completed' THEN 'completed'
        WHEN ogs.status = 'cancelled' THEN 'cancelled'
        WHEN ogs.status = 'in_progress' THEN 'in_progress'
        ELSE 'assigned'
    END as status
FROM organization_goal_subtasks ogs
WHERE ogs.assigned_to IS NOT NULL
ON CONFLICT (subtask_id, staff_id) DO NOTHING;

-- Update assigned_by: find the staff_id for the user who created the subtask
UPDATE organization_goal_subtask_assignments ogsa
SET assigned_by = (
    SELECT os.id 
    FROM organization_staff os
    INNER JOIN organization_goal_subtasks ogs ON ogsa.subtask_id = ogs.id
    INNER JOIN organization_goals og ON ogs.goal_id = og.id
    WHERE os.organization_id = og.organization_id
    AND os.user_id = ogs.created_by
    LIMIT 1
)
WHERE assigned_by IS NULL;

-- Enable Row Level Security
ALTER TABLE organization_goal_subtask_assignments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for organization_goal_subtask_assignments
CREATE POLICY "Users can view subtask assignments for accessible goals"
    ON organization_goal_subtask_assignments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM organization_goal_subtasks ogs
            INNER JOIN organization_goals og ON ogs.goal_id = og.id
            LEFT JOIN organization_staff os ON og.organization_id = os.organization_id
            WHERE ogs.id = organization_goal_subtask_assignments.subtask_id
            AND (os.user_id = auth.uid() OR og.organization_id IN (
                SELECT id FROM organizations WHERE owner_id = auth.uid()
            ))
        )
    );

CREATE POLICY "Users can create subtask assignments for accessible goals"
    ON organization_goal_subtask_assignments FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM organization_goal_subtasks ogs
            INNER JOIN organization_goals og ON ogs.goal_id = og.id
            LEFT JOIN organization_staff os ON og.organization_id = os.organization_id
            WHERE ogs.id = organization_goal_subtask_assignments.subtask_id
            AND (os.user_id = auth.uid() OR og.organization_id IN (
                SELECT id FROM organizations WHERE owner_id = auth.uid()
            ))
            AND (os.access_level >= 4 OR og.organization_id IN (
                SELECT id FROM organizations WHERE owner_id = auth.uid()
            ))
        )
    );

CREATE POLICY "Users can update subtask assignments for accessible goals"
    ON organization_goal_subtask_assignments FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM organization_goal_subtasks ogs
            INNER JOIN organization_goals og ON ogs.goal_id = og.id
            LEFT JOIN organization_staff os ON og.organization_id = os.organization_id
            WHERE ogs.id = organization_goal_subtask_assignments.subtask_id
            AND (os.user_id = auth.uid() OR og.organization_id IN (
                SELECT id FROM organizations WHERE owner_id = auth.uid()
            ))
            AND (os.access_level >= 4 OR og.organization_id IN (
                SELECT id FROM organizations WHERE owner_id = auth.uid()
            ))
        )
    );

CREATE POLICY "Users can delete subtask assignments for accessible goals"
    ON organization_goal_subtask_assignments FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM organization_goal_subtasks ogs
            INNER JOIN organization_goals og ON ogs.goal_id = og.id
            LEFT JOIN organization_staff os ON og.organization_id = os.organization_id
            WHERE ogs.id = organization_goal_subtask_assignments.subtask_id
            AND (os.user_id = auth.uid() OR og.organization_id IN (
                SELECT id FROM organizations WHERE owner_id = auth.uid()
            ))
            AND (os.access_level >= 4 OR og.organization_id IN (
                SELECT id FROM organizations WHERE owner_id = auth.uid()
            ))
        )
    );

-- Add comment
COMMENT ON TABLE organization_goal_subtask_assignments IS 'Junction table for multiple staff assignments to goal subtasks';
COMMENT ON COLUMN organization_goal_subtask_assignments.status IS 'Individual assignment status (can differ from subtask status)';

