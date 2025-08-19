-- Create project_links table for storing project-related URLs and links
CREATE TABLE IF NOT EXISTS project_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    description TEXT,
    category VARCHAR(100) DEFAULT 'general', -- 'research', 'reference', 'tool', 'resource', 'general'
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_project_links_project_id ON project_links(project_id);
CREATE INDEX idx_project_links_created_by ON project_links(created_by);
CREATE INDEX idx_project_links_category ON project_links(category);
CREATE INDEX idx_project_links_created_at ON project_links(created_at);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_project_links_updated_at
    BEFORE UPDATE ON project_links
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE project_links ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view links for projects they have access to
CREATE POLICY "Users can view project links" ON project_links
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM team_members tm
            WHERE tm.project_id = project_links.project_id
            AND tm.user_id = auth.uid()
        )
    );

-- Policy: Users can create links for projects they are members of
CREATE POLICY "Users can create project links" ON project_links
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM team_members tm
            WHERE tm.project_id = project_links.project_id
            AND tm.user_id = auth.uid()
        )
    );

-- Policy: Users can update links they created
CREATE POLICY "Users can update their own project links" ON project_links
    FOR UPDATE USING (
        created_by = auth.uid()
    );

-- Policy: Users can delete links they created
CREATE POLICY "Users can delete their own project links" ON project_links
    FOR DELETE USING (
        created_by = auth.uid()
    );

