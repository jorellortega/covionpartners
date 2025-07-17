-- Create a universal entity links table
CREATE TABLE IF NOT EXISTS entity_links (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    source_entity_type TEXT NOT NULL CHECK (source_entity_type IN ('task', 'timeline', 'project', 'organization', 'note', 'file')),
    source_entity_id UUID NOT NULL,
    target_entity_type TEXT NOT NULL CHECK (target_entity_type IN ('task', 'timeline', 'project', 'organization', 'note', 'file')),
    target_entity_id UUID NOT NULL,
    link_type TEXT DEFAULT 'association',
    
    -- Context fields for better querying and security
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Prevent duplicate links
    UNIQUE(source_entity_type, source_entity_id, target_entity_type, target_entity_id),
    
    -- Prevent self-linking
    CHECK (source_entity_id != target_entity_id OR source_entity_type != target_entity_type)
);

-- Create indexes for efficient querying
CREATE INDEX idx_entity_links_source ON entity_links(source_entity_type, source_entity_id);
CREATE INDEX idx_entity_links_target ON entity_links(target_entity_type, target_entity_id);
CREATE INDEX idx_entity_links_bidirectional ON entity_links(source_entity_type, source_entity_id, target_entity_type, target_entity_id);
CREATE INDEX idx_entity_links_project ON entity_links(project_id);
CREATE INDEX idx_entity_links_organization ON entity_links(organization_id);
CREATE INDEX idx_entity_links_created_by ON entity_links(created_by);

-- Add comments
COMMENT ON TABLE entity_links IS 'Universal linking table for connecting any entity to any other entity';
COMMENT ON COLUMN entity_links.source_entity_type IS 'Type of the source entity (task, timeline, project, etc.)';
COMMENT ON COLUMN entity_links.source_entity_id IS 'ID of the source entity';
COMMENT ON COLUMN entity_links.target_entity_type IS 'Type of the target entity (task, timeline, project, etc.)';
COMMENT ON COLUMN entity_links.target_entity_id IS 'ID of the target entity';
COMMENT ON COLUMN entity_links.link_type IS 'Type of relationship (association, dependency, etc.)';
COMMENT ON COLUMN entity_links.project_id IS 'Project context for the link (for project-scoped entities)';
COMMENT ON COLUMN entity_links.organization_id IS 'Organization context for the link (for org-scoped entities)';

-- Enable RLS
ALTER TABLE entity_links ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view links for entities they have access to"
    ON entity_links FOR SELECT
    USING (
        -- Direct project access
        (project_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM projects p
            LEFT JOIN team_members tm ON tm.project_id = p.id
            WHERE p.id = project_id
            AND (
                p.owner_id = auth.uid() OR
                tm.user_id = auth.uid() OR
                p.visibility = 'public'
            )
        ))
        OR
        -- Direct organization access
        (organization_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM organizations o
            LEFT JOIN organization_members om ON om.organization_id = o.id
            WHERE o.id = organization_id
            AND (
                o.owner_id = auth.uid() OR
                om.user_id = auth.uid()
            )
        ))
        OR
        -- Fallback: check entity-specific access
        EXISTS (
            SELECT 1 FROM projects p
            LEFT JOIN team_members tm ON tm.project_id = p.id
            WHERE (
                (source_entity_type = 'project' AND source_entity_id = p.id) OR
                (target_entity_type = 'project' AND target_entity_id = p.id) OR
                (source_entity_type = 'task' AND EXISTS (
                    SELECT 1 FROM tasks t WHERE t.id = source_entity_id AND t.project_id = p.id
                )) OR
                (target_entity_type = 'task' AND EXISTS (
                    SELECT 1 FROM tasks t WHERE t.id = target_entity_id AND t.project_id = p.id
                )) OR
                (source_entity_type = 'timeline' AND EXISTS (
                    SELECT 1 FROM project_timeline pt WHERE pt.id = source_entity_id AND pt.project_id = p.id
                )) OR
                (target_entity_type = 'timeline' AND EXISTS (
                    SELECT 1 FROM project_timeline pt WHERE pt.id = target_entity_id AND pt.project_id = p.id
                ))
            )
            AND (
                p.owner_id = auth.uid() OR
                tm.user_id = auth.uid() OR
                p.visibility = 'public'
            )
        )
    );

CREATE POLICY "Users can create links for entities they have access to"
    ON entity_links FOR INSERT
    WITH CHECK (
        created_by = auth.uid() AND
        (
            -- Direct project access
            (project_id IS NOT NULL AND EXISTS (
                SELECT 1 FROM projects p
                LEFT JOIN team_members tm ON tm.project_id = p.id
                WHERE p.id = project_id
                AND (
                    p.owner_id = auth.uid() OR
                    tm.user_id = auth.uid()
                )
            ))
            OR
            -- Direct organization access
            (organization_id IS NOT NULL AND EXISTS (
                SELECT 1 FROM organizations o
                LEFT JOIN organization_members om ON om.organization_id = o.id
                WHERE o.id = organization_id
                AND (
                    o.owner_id = auth.uid() OR
                    om.user_id = auth.uid()
                )
            ))
            OR
            -- Fallback: check entity-specific access
            EXISTS (
                SELECT 1 FROM projects p
                LEFT JOIN team_members tm ON tm.project_id = p.id
                WHERE (
                    (source_entity_type = 'project' AND source_entity_id = p.id) OR
                    (target_entity_type = 'project' AND target_entity_id = p.id) OR
                    (source_entity_type = 'task' AND EXISTS (
                        SELECT 1 FROM tasks t WHERE t.id = source_entity_id AND t.project_id = p.id
                    )) OR
                    (target_entity_type = 'task' AND EXISTS (
                        SELECT 1 FROM tasks t WHERE t.id = target_entity_id AND t.project_id = p.id
                    )) OR
                    (source_entity_type = 'timeline' AND EXISTS (
                        SELECT 1 FROM project_timeline pt WHERE pt.id = source_entity_id AND pt.project_id = p.id
                    )) OR
                    (target_entity_type = 'timeline' AND EXISTS (
                        SELECT 1 FROM project_timeline pt WHERE pt.id = target_entity_id AND pt.project_id = p.id
                    ))
                )
                AND (
                    p.owner_id = auth.uid() OR
                    tm.user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Users can delete links they created"
    ON entity_links FOR DELETE
    USING (created_by = auth.uid());

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION update_entity_links_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER set_entity_links_updated_at
    BEFORE UPDATE ON entity_links
    FOR EACH ROW
    EXECUTE FUNCTION update_entity_links_updated_at(); 