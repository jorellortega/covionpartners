-- Fix RLS policies for corporate_task_assignments and organization_goal_assignments
-- to allow organization owners to view assignments even if they don't have staff records

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view task assignments for their organization" ON corporate_task_assignments;
DROP POLICY IF EXISTS "Users can view goal assignments for their organization" ON organization_goal_assignments;

-- Create updated policies that also check for organization ownership
CREATE POLICY "Users can view task assignments for their organization"
    ON corporate_task_assignments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM corporate_tasks ct
            WHERE ct.id = corporate_task_assignments.task_id
            AND (
                -- User has staff record in the organization
                EXISTS (
                    SELECT 1 FROM organization_staff os
                    WHERE os.organization_id = ct.organization_id
                    AND os.user_id = auth.uid()
                )
                OR
                -- User is the organization owner
                EXISTS (
                    SELECT 1 FROM organizations o
                    WHERE o.id = ct.organization_id
                    AND o.owner_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Users can view goal assignments for their organization"
    ON organization_goal_assignments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM organization_goals og
            WHERE og.id = organization_goal_assignments.goal_id
            AND (
                -- User has staff record in the organization
                EXISTS (
                    SELECT 1 FROM organization_staff os
                    WHERE os.organization_id = og.organization_id
                    AND os.user_id = auth.uid()
                )
                OR
                -- User is the organization owner
                EXISTS (
                    SELECT 1 FROM organizations o
                    WHERE o.id = og.organization_id
                    AND o.owner_id = auth.uid()
                )
            )
        )
    );

-- Also update INSERT policies to allow owners
DROP POLICY IF EXISTS "Users can create task assignments in their organization" ON corporate_task_assignments;
DROP POLICY IF EXISTS "Users can create goal assignments in their organization" ON organization_goal_assignments;

CREATE POLICY "Users can create task assignments in their organization"
    ON corporate_task_assignments FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM corporate_tasks ct
            WHERE ct.id = corporate_task_assignments.task_id
            AND (
                -- User has staff record with access_level >= 4
                EXISTS (
                    SELECT 1 FROM organization_staff os
                    WHERE os.organization_id = ct.organization_id
                    AND os.user_id = auth.uid()
                    AND os.access_level >= 4
                )
                OR
                -- User is the organization owner
                EXISTS (
                    SELECT 1 FROM organizations o
                    WHERE o.id = ct.organization_id
                    AND o.owner_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Users can create goal assignments in their organization"
    ON organization_goal_assignments FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM organization_goals og
            WHERE og.id = organization_goal_assignments.goal_id
            AND (
                -- User has staff record with access_level >= 4
                EXISTS (
                    SELECT 1 FROM organization_staff os
                    WHERE os.organization_id = og.organization_id
                    AND os.user_id = auth.uid()
                    AND os.access_level >= 4
                )
                OR
                -- User is the organization owner
                EXISTS (
                    SELECT 1 FROM organizations o
                    WHERE o.id = og.organization_id
                    AND o.owner_id = auth.uid()
                )
            )
        )
    );

-- Also update UPDATE policies
DROP POLICY IF EXISTS "Users can update task assignments in their organization" ON corporate_task_assignments;
DROP POLICY IF EXISTS "Users can update goal assignments in their organization" ON organization_goal_assignments;

CREATE POLICY "Users can update task assignments in their organization"
    ON corporate_task_assignments FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM corporate_tasks ct
            WHERE ct.id = corporate_task_assignments.task_id
            AND (
                -- User has staff record with access_level >= 4
                EXISTS (
                    SELECT 1 FROM organization_staff os
                    WHERE os.organization_id = ct.organization_id
                    AND os.user_id = auth.uid()
                    AND os.access_level >= 4
                )
                OR
                -- User is the organization owner
                EXISTS (
                    SELECT 1 FROM organizations o
                    WHERE o.id = ct.organization_id
                    AND o.owner_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Users can update goal assignments in their organization"
    ON organization_goal_assignments FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM organization_goals og
            WHERE og.id = organization_goal_assignments.goal_id
            AND (
                -- User has staff record with access_level >= 4
                EXISTS (
                    SELECT 1 FROM organization_staff os
                    WHERE os.organization_id = og.organization_id
                    AND os.user_id = auth.uid()
                    AND os.access_level >= 4
                )
                OR
                -- User is the organization owner
                EXISTS (
                    SELECT 1 FROM organizations o
                    WHERE o.id = og.organization_id
                    AND o.owner_id = auth.uid()
                )
            )
        )
    );

-- Also update DELETE policies
DROP POLICY IF EXISTS "Users can delete task assignments in their organization" ON corporate_task_assignments;
DROP POLICY IF EXISTS "Users can delete goal assignments in their organization" ON organization_goal_assignments;

CREATE POLICY "Users can delete task assignments in their organization"
    ON corporate_task_assignments FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM corporate_tasks ct
            WHERE ct.id = corporate_task_assignments.task_id
            AND (
                -- User has staff record with access_level >= 4
                EXISTS (
                    SELECT 1 FROM organization_staff os
                    WHERE os.organization_id = ct.organization_id
                    AND os.user_id = auth.uid()
                    AND os.access_level >= 4
                )
                OR
                -- User is the organization owner
                EXISTS (
                    SELECT 1 FROM organizations o
                    WHERE o.id = ct.organization_id
                    AND o.owner_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Users can delete goal assignments in their organization"
    ON organization_goal_assignments FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM organization_goals og
            WHERE og.id = organization_goal_assignments.goal_id
            AND (
                -- User has staff record with access_level >= 4
                EXISTS (
                    SELECT 1 FROM organization_staff os
                    WHERE os.organization_id = og.organization_id
                    AND os.user_id = auth.uid()
                    AND os.access_level >= 4
                )
                OR
                -- User is the organization owner
                EXISTS (
                    SELECT 1 FROM organizations o
                    WHERE o.id = og.organization_id
                    AND o.owner_id = auth.uid()
                )
            )
        )
    );

