-- Create work_activities table if it doesn't exist
CREATE TABLE IF NOT EXISTS work_activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL CHECK (activity_type IN ('task_update', 'note_created', 'file_uploaded', 'comment_posted', 'session_started', 'session_ended', 'status_changed')) NOT NULL,
    activity_data JSONB, -- Store additional activity-specific data
    related_entity_type TEXT,
    related_entity_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_work_activities_user_id ON work_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_work_activities_project_id ON work_activities(project_id);
CREATE INDEX IF NOT EXISTS idx_work_activities_activity_type ON work_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_work_activities_created_at ON work_activities(created_at);

-- Enable Row Level Security
ALTER TABLE work_activities ENABLE ROW LEVEL SECURITY;

-- Work activities policies
CREATE POLICY "Users can view activities for projects they're members of"
    ON work_activities FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM team_members
            WHERE team_members.project_id = work_activities.project_id
            AND team_members.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = work_activities.project_id
            AND projects.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can create their own activities"
    ON work_activities FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own activities"
    ON work_activities FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own activities"
    ON work_activities FOR DELETE
    USING (user_id = auth.uid());
