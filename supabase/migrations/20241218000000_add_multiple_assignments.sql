-- Add support for multiple assignments to corporate tasks and organization goals
-- This migration creates junction tables for many-to-many relationships

-- Create corporate_task_assignments table for multiple task assignments
CREATE TABLE IF NOT EXISTS corporate_task_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES corporate_tasks(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES organization_staff(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES organization_staff(id) ON DELETE SET NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(task_id, staff_id)
);

-- Create organization_goal_assignments table for multiple goal assignments
CREATE TABLE IF NOT EXISTS organization_goal_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    goal_id UUID NOT NULL REFERENCES organization_goals(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES organization_staff(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES organization_staff(id) ON DELETE SET NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(goal_id, staff_id)
);

-- Create indexes for better performance
CREATE INDEX idx_corporate_task_assignments_task_id ON corporate_task_assignments(task_id);
CREATE INDEX idx_corporate_task_assignments_staff_id ON corporate_task_assignments(staff_id);
CREATE INDEX idx_corporate_task_assignments_status ON corporate_task_assignments(status);

CREATE INDEX idx_organization_goal_assignments_goal_id ON organization_goal_assignments(goal_id);
CREATE INDEX idx_organization_goal_assignments_staff_id ON organization_goal_assignments(staff_id);
CREATE INDEX idx_organization_goal_assignments_status ON organization_goal_assignments(status);

-- Migrate existing single assignments to the new junction tables
-- For corporate tasks
INSERT INTO corporate_task_assignments (task_id, staff_id, assigned_by, status)
SELECT 
    id as task_id,
    assigned_to as staff_id,
    assigned_by,
    CASE 
        WHEN status = 'completed' THEN 'completed'
        WHEN status = 'cancelled' THEN 'cancelled'
        WHEN status = 'in_progress' THEN 'in_progress'
        ELSE 'assigned'
    END as status
FROM corporate_tasks 
WHERE assigned_to IS NOT NULL;

-- For organization goals
INSERT INTO organization_goal_assignments (goal_id, staff_id, assigned_by, status)
SELECT 
    id as goal_id,
    assigned_to as staff_id,
    assigned_by,
    CASE 
        WHEN status = 'completed' THEN 'completed'
        WHEN status = 'paused' THEN 'cancelled'
        ELSE 'assigned'
    END as status
FROM organization_goals 
WHERE assigned_to IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE corporate_task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_goal_assignments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for corporate_task_assignments
CREATE POLICY "Users can view task assignments for their organization"
    ON corporate_task_assignments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM corporate_tasks ct
            JOIN organization_staff os ON ct.organization_id = os.organization_id
            WHERE ct.id = corporate_task_assignments.task_id
            AND os.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create task assignments in their organization"
    ON corporate_task_assignments FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM corporate_tasks ct
            JOIN organization_staff os ON ct.organization_id = os.organization_id
            WHERE ct.id = corporate_task_assignments.task_id
            AND os.user_id = auth.uid()
            AND os.access_level >= 4
        )
    );

CREATE POLICY "Users can update task assignments in their organization"
    ON corporate_task_assignments FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM corporate_tasks ct
            JOIN organization_staff os ON ct.organization_id = os.organization_id
            WHERE ct.id = corporate_task_assignments.task_id
            AND os.user_id = auth.uid()
            AND os.access_level >= 4
        )
    );

CREATE POLICY "Users can delete task assignments in their organization"
    ON corporate_task_assignments FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM corporate_tasks ct
            JOIN organization_staff os ON ct.organization_id = os.organization_id
            WHERE ct.id = corporate_task_assignments.task_id
            AND os.user_id = auth.uid()
            AND os.access_level >= 4
        )
    );

-- Create RLS policies for organization_goal_assignments
CREATE POLICY "Users can view goal assignments for their organization"
    ON organization_goal_assignments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM organization_goals og
            JOIN organization_staff os ON og.organization_id = os.organization_id
            WHERE og.id = organization_goal_assignments.goal_id
            AND os.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create goal assignments in their organization"
    ON organization_goal_assignments FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM organization_goals og
            JOIN organization_staff os ON og.organization_id = os.organization_id
            WHERE og.id = organization_goal_assignments.goal_id
            AND os.user_id = auth.uid()
            AND os.access_level >= 4
        )
    );

CREATE POLICY "Users can update goal assignments in their organization"
    ON organization_goal_assignments FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM organization_goals og
            JOIN organization_staff os ON og.organization_id = os.organization_id
            WHERE og.id = organization_goal_assignments.goal_id
            AND os.user_id = auth.uid()
            AND os.access_level >= 4
        )
    );

CREATE POLICY "Users can delete goal assignments in their organization"
    ON organization_goal_assignments FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM organization_goals og
            JOIN organization_staff os ON og.organization_id = os.organization_id
            WHERE og.id = organization_goal_assignments.goal_id
            AND os.user_id = auth.uid()
            AND os.access_level >= 4
        )
    );

-- Add comments
COMMENT ON TABLE corporate_task_assignments IS 'Junction table for multiple staff assignments to corporate tasks';
COMMENT ON TABLE organization_goal_assignments IS 'Junction table for multiple staff assignments to organization goals';
COMMENT ON COLUMN corporate_task_assignments.status IS 'Individual assignment status (can differ from task status)';
COMMENT ON COLUMN organization_goal_assignments.status IS 'Individual assignment status (can differ from goal status)';
