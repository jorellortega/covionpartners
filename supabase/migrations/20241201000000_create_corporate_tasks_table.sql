-- Create corporate_tasks table for organization-level task management
CREATE TABLE IF NOT EXISTS corporate_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    assigned_to UUID REFERENCES organization_staff(id) ON DELETE SET NULL,
    assigned_by UUID REFERENCES organization_staff(id) ON DELETE SET NULL,
    due_date DATE,
    category TEXT NOT NULL DEFAULT 'other' CHECK (category IN ('strategy', 'operations', 'finance', 'hr', 'marketing', 'technology', 'other')),
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create organization_goals table for strategic objectives
CREATE TABLE IF NOT EXISTS organization_goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    target_date DATE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    category TEXT NOT NULL DEFAULT 'strategic' CHECK (category IN ('financial', 'growth', 'operational', 'strategic')),
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX idx_corporate_tasks_organization_id ON corporate_tasks(organization_id);
CREATE INDEX idx_corporate_tasks_assigned_to ON corporate_tasks(assigned_to);
CREATE INDEX idx_corporate_tasks_assigned_by ON corporate_tasks(assigned_by);
CREATE INDEX idx_corporate_tasks_status ON corporate_tasks(status);
CREATE INDEX idx_corporate_tasks_priority ON corporate_tasks(priority);
CREATE INDEX idx_corporate_tasks_category ON corporate_tasks(category);
CREATE INDEX idx_corporate_tasks_due_date ON corporate_tasks(due_date);
CREATE INDEX idx_corporate_tasks_project_id ON corporate_tasks(project_id);

CREATE INDEX idx_organization_goals_organization_id ON organization_goals(organization_id);
CREATE INDEX idx_organization_goals_status ON organization_goals(status);
CREATE INDEX idx_organization_goals_priority ON organization_goals(priority);
CREATE INDEX idx_organization_goals_category ON organization_goals(category);
CREATE INDEX idx_organization_goals_target_date ON organization_goals(target_date);
CREATE INDEX idx_organization_goals_project_id ON organization_goals(project_id);

-- Enable RLS on both tables
ALTER TABLE corporate_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_goals ENABLE ROW LEVEL SECURITY;

-- Create policies for corporate_tasks table
CREATE POLICY "Users can view corporate tasks in their organizations"
ON corporate_tasks
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM organizations
        WHERE organizations.id = corporate_tasks.organization_id
        AND (
            organizations.owner_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM organization_staff
                WHERE organization_staff.organization_id = organizations.id
                AND organization_staff.user_id = auth.uid()
            )
        )
    )
);

CREATE POLICY "Organization owners and high-level staff can create corporate tasks"
ON corporate_tasks
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM organizations
        WHERE organizations.id = corporate_tasks.organization_id
        AND (
            organizations.owner_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM organization_staff
                WHERE organization_staff.organization_id = organizations.id
                AND organization_staff.user_id = auth.uid()
                AND organization_staff.access_level >= 4
            )
        )
    )
);

CREATE POLICY "Organization owners and high-level staff can update corporate tasks"
ON corporate_tasks
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM organizations
        WHERE organizations.id = corporate_tasks.organization_id
        AND (
            organizations.owner_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM organization_staff
                WHERE organization_staff.organization_id = organizations.id
                AND organization_staff.user_id = auth.uid()
                AND organization_staff.access_level >= 4
            )
        )
    )
);

CREATE POLICY "Organization owners and high-level staff can delete corporate tasks"
ON corporate_tasks
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM organizations
        WHERE organizations.id = corporate_tasks.organization_id
        AND (
            organizations.owner_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM organization_staff
                WHERE organization_staff.organization_id = organizations.id
                AND organization_staff.user_id = auth.uid()
                AND organization_staff.access_level >= 4
            )
        )
    )
);

-- Create policies for organization_goals table
CREATE POLICY "Users can view organization goals in their organizations"
ON organization_goals
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM organizations
        WHERE organizations.id = organization_goals.organization_id
        AND (
            organizations.owner_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM organization_staff
                WHERE organization_staff.organization_id = organizations.id
                AND organization_staff.user_id = auth.uid()
            )
        )
    )
);

CREATE POLICY "Organization owners and high-level staff can create organization goals"
ON organization_goals
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM organizations
        WHERE organizations.id = organization_goals.organization_id
        AND (
            organizations.owner_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM organization_staff
                WHERE organization_staff.organization_id = organizations.id
                AND organization_staff.user_id = auth.uid()
                AND organization_staff.access_level >= 4
            )
        )
    )
);

CREATE POLICY "Organization owners and high-level staff can update organization goals"
ON organization_goals
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM organizations
        WHERE organizations.id = organization_goals.organization_id
        AND (
            organizations.owner_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM organization_staff
                WHERE organization_staff.organization_id = organizations.id
                AND organization_staff.user_id = auth.uid()
                AND organization_staff.access_level >= 4
            )
        )
    )
);

CREATE POLICY "Organization owners and high-level staff can delete organization goals"
ON organization_goals
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM organizations
        WHERE organizations.id = organization_goals.organization_id
        AND (
            organizations.owner_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM organization_staff
                WHERE organization_staff.organization_id = organizations.id
                AND organization_staff.user_id = auth.uid()
                AND organization_staff.access_level >= 4
            )
        )
    )
);

-- Add comments
COMMENT ON TABLE corporate_tasks IS 'Organization-level tasks assigned to staff members';
COMMENT ON TABLE organization_goals IS 'Strategic objectives and organizational targets';
COMMENT ON COLUMN corporate_tasks.priority IS 'Task priority level (low, medium, high, critical)';
COMMENT ON COLUMN corporate_tasks.status IS 'Current status of the task';
COMMENT ON COLUMN corporate_tasks.category IS 'Business category for the task';
COMMENT ON COLUMN corporate_tasks.project_id IS 'Optional link to a specific project';
COMMENT ON COLUMN organization_goals.category IS 'Type of organizational goal';
COMMENT ON COLUMN organization_goals.project_id IS 'Optional link to a specific project';
