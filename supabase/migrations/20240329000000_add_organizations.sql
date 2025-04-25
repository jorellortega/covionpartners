-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_plan TEXT NOT NULL DEFAULT 'free',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT valid_subscription_plan CHECK (subscription_plan IN ('free', 'enterprise'))
);

-- Add organization_id to projects table
ALTER TABLE projects
ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

-- Add organization_id to team_members table
ALTER TABLE team_members
ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

-- Create indexes for better query performance
CREATE INDEX idx_organizations_owner_id ON organizations(owner_id);
CREATE INDEX idx_organizations_subscription_plan ON organizations(subscription_plan);
CREATE INDEX idx_projects_organization_id ON projects(organization_id);
CREATE INDEX idx_team_members_organization_id ON team_members(organization_id);

-- Enable RLS on organizations table
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Create policies for organizations table
CREATE POLICY "Users can view organizations they own or are members of"
ON organizations
FOR SELECT
USING (
    owner_id = auth.uid() OR
    EXISTS (
        SELECT 1 FROM team_members
        WHERE team_members.organization_id = organizations.id
        AND team_members.user_id = auth.uid()
    )
);

CREATE POLICY "Enterprise users can create organizations"
ON organizations
FOR INSERT
WITH CHECK (
    owner_id = auth.uid() AND
    subscription_plan = 'enterprise'
);

CREATE POLICY "Organization owners can update their organizations"
ON organizations
FOR UPDATE
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Organization owners can delete their organizations"
ON organizations
FOR DELETE
USING (owner_id = auth.uid());

-- Update RLS policies for projects to handle both organization and independent access
DROP POLICY IF EXISTS "Enable full access for authenticated users" ON projects;
CREATE POLICY "Users can access their projects and organization projects"
ON projects
FOR ALL
USING (
    -- Direct project ownership
    owner_id = auth.uid() OR
    -- Project team membership
    EXISTS (
        SELECT 1 FROM team_members
        WHERE team_members.project_id = projects.id
        AND team_members.user_id = auth.uid()
    ) OR
    -- Organization-based access (if project belongs to an organization)
    (
        projects.organization_id IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM organizations
            WHERE organizations.id = projects.organization_id
            AND (
                organizations.owner_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM team_members
                    WHERE team_members.organization_id = organizations.id
                    AND team_members.user_id = auth.uid()
                )
            )
        )
    )
);

-- Update RLS policies for team_members to handle both organization and independent access
DROP POLICY IF EXISTS "Enable full access for authenticated users" ON team_members;
CREATE POLICY "Users can access team members in their projects and organizations"
ON team_members
FOR ALL
USING (
    -- Direct team membership
    user_id = auth.uid() OR
    -- Project ownership
    EXISTS (
        SELECT 1 FROM projects
        WHERE projects.id = team_members.project_id
        AND projects.owner_id = auth.uid()
    ) OR
    -- Organization-based access (if team member belongs to an organization)
    (
        team_members.organization_id IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM organizations
            WHERE organizations.id = team_members.organization_id
            AND (
                organizations.owner_id = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM team_members tm
                    WHERE tm.organization_id = organizations.id
                    AND tm.user_id = auth.uid()
                    AND tm.role = 'admin'
                )
            )
        )
    )
); 