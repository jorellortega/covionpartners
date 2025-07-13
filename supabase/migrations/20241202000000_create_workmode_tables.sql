-- Create workmode collaboration system tables

-- 1. User presence tracking table
CREATE TABLE IF NOT EXISTS user_presence (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('online', 'away', 'busy', 'offline')) DEFAULT 'offline',
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    current_page TEXT,
    is_typing BOOLEAN DEFAULT false,
    typing_in TEXT, -- room/thread they're typing in
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, project_id)
);

-- 2. Work sessions table
CREATE TABLE IF NOT EXISTS work_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    session_type TEXT NOT NULL CHECK (session_type IN ('focused', 'collaborative', 'meeting', 'break')) DEFAULT 'focused',
    status TEXT NOT NULL CHECK (status IN ('active', 'paused', 'completed')) DEFAULT 'active',
    start_time TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Work collaboration rooms
CREATE TABLE IF NOT EXISTS work_collaboration_rooms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    room_type TEXT NOT NULL CHECK (room_type IN ('general', 'tasks', 'notes', 'files', 'meeting')) DEFAULT 'general',
    is_active BOOLEAN DEFAULT true,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Work comments (project-specific threaded comments)
CREATE TABLE IF NOT EXISTS work_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    room_id UUID REFERENCES work_collaboration_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES work_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    comment_type TEXT NOT NULL CHECK (comment_type IN ('general', 'task', 'note', 'file', 'meeting')) DEFAULT 'general',
    related_entity_type TEXT, -- 'task', 'note', 'file', etc.
    related_entity_id UUID, -- ID of the related entity
    is_pinned BOOLEAN DEFAULT false,
    is_resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Work activities (track what users are doing)
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

-- 6. Work session participants (for collaborative sessions)
CREATE TABLE IF NOT EXISTS work_session_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES work_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('host', 'participant', 'observer')) DEFAULT 'participant',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    left_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(session_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX idx_user_presence_user_id ON user_presence(user_id);
CREATE INDEX idx_user_presence_project_id ON user_presence(project_id);
CREATE INDEX idx_user_presence_status ON user_presence(status);
CREATE INDEX idx_user_presence_last_seen ON user_presence(last_seen);

CREATE INDEX idx_work_sessions_user_id ON work_sessions(user_id);
CREATE INDEX idx_work_sessions_project_id ON work_sessions(project_id);
CREATE INDEX idx_work_sessions_status ON work_sessions(status);
CREATE INDEX idx_work_sessions_start_time ON work_sessions(start_time);

CREATE INDEX idx_work_collaboration_rooms_project_id ON work_collaboration_rooms(project_id);
CREATE INDEX idx_work_collaboration_rooms_type ON work_collaboration_rooms(room_type);

CREATE INDEX idx_work_comments_project_id ON work_comments(project_id);
CREATE INDEX idx_work_comments_room_id ON work_comments(room_id);
CREATE INDEX idx_work_comments_user_id ON work_comments(user_id);
CREATE INDEX idx_work_comments_parent_id ON work_comments(parent_id);
CREATE INDEX idx_work_comments_created_at ON work_comments(created_at);

CREATE INDEX idx_work_activities_user_id ON work_activities(user_id);
CREATE INDEX idx_work_activities_project_id ON work_activities(project_id);
CREATE INDEX idx_work_activities_type ON work_activities(activity_type);
CREATE INDEX idx_work_activities_created_at ON work_activities(created_at);

CREATE INDEX idx_work_session_participants_session_id ON work_session_participants(session_id);
CREATE INDEX idx_work_session_participants_user_id ON work_session_participants(user_id);

-- Enable Row Level Security
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_collaboration_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_session_participants ENABLE ROW LEVEL SECURITY;

-- User presence policies
CREATE POLICY "Users can view presence for projects they're members of"
    ON user_presence FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM team_members
            WHERE team_members.project_id = user_presence.project_id
            AND team_members.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = user_presence.project_id
            AND projects.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own presence"
    ON user_presence FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can insert their own presence"
    ON user_presence FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- Work sessions policies
CREATE POLICY "Users can view sessions for projects they're members of"
    ON work_sessions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM team_members
            WHERE team_members.project_id = work_sessions.project_id
            AND team_members.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = work_sessions.project_id
            AND projects.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can create sessions for projects they're members of"
    ON work_sessions FOR INSERT
    WITH CHECK (
        user_id = auth.uid()
        AND (
            EXISTS (
                SELECT 1 FROM team_members
                WHERE team_members.project_id = work_sessions.project_id
                AND team_members.user_id = auth.uid()
            )
            OR
            EXISTS (
                SELECT 1 FROM projects
                WHERE projects.id = work_sessions.project_id
                AND projects.owner_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update their own sessions"
    ON work_sessions FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Work collaboration rooms policies
CREATE POLICY "Users can view rooms for projects they're members of"
    ON work_collaboration_rooms FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM team_members
            WHERE team_members.project_id = work_collaboration_rooms.project_id
            AND team_members.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = work_collaboration_rooms.project_id
            AND projects.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can create rooms for projects they're members of"
    ON work_collaboration_rooms FOR INSERT
    WITH CHECK (
        created_by = auth.uid()
        AND (
            EXISTS (
                SELECT 1 FROM team_members
                WHERE team_members.project_id = work_collaboration_rooms.project_id
                AND team_members.user_id = auth.uid()
            )
            OR
            EXISTS (
                SELECT 1 FROM projects
                WHERE projects.id = work_collaboration_rooms.project_id
                AND projects.owner_id = auth.uid()
            )
        )
    );

-- Work comments policies
CREATE POLICY "Users can view comments for projects they're members of"
    ON work_comments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM team_members
            WHERE team_members.project_id = work_comments.project_id
            AND team_members.user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = work_comments.project_id
            AND projects.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can create comments for projects they're members of"
    ON work_comments FOR INSERT
    WITH CHECK (
        user_id = auth.uid()
        AND (
            EXISTS (
                SELECT 1 FROM team_members
                WHERE team_members.project_id = work_comments.project_id
                AND team_members.user_id = auth.uid()
            )
            OR
            EXISTS (
                SELECT 1 FROM projects
                WHERE projects.id = work_comments.project_id
                AND projects.owner_id = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update their own comments"
    ON work_comments FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own comments"
    ON work_comments FOR DELETE
    USING (user_id = auth.uid());

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

-- Work session participants policies
CREATE POLICY "Users can view participants for sessions they're part of"
    ON work_session_participants FOR SELECT
    USING (
        user_id = auth.uid()
        OR
        EXISTS (
            SELECT 1 FROM work_sessions
            WHERE work_sessions.id = work_session_participants.session_id
            AND work_sessions.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can join sessions for projects they're members of"
    ON work_session_participants FOR INSERT
    WITH CHECK (
        user_id = auth.uid()
        AND
        EXISTS (
            SELECT 1 FROM work_sessions ws
            JOIN team_members tm ON tm.project_id = ws.project_id
            WHERE ws.id = work_session_participants.session_id
            AND tm.user_id = auth.uid()
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_workmode_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER set_user_presence_updated_at
    BEFORE UPDATE ON user_presence
    FOR EACH ROW
    EXECUTE FUNCTION update_workmode_updated_at();

CREATE TRIGGER set_work_sessions_updated_at
    BEFORE UPDATE ON work_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_workmode_updated_at();

CREATE TRIGGER set_work_collaboration_rooms_updated_at
    BEFORE UPDATE ON work_collaboration_rooms
    FOR EACH ROW
    EXECUTE FUNCTION update_workmode_updated_at();

CREATE TRIGGER set_work_comments_updated_at
    BEFORE UPDATE ON work_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_workmode_updated_at();

-- Create function to automatically create default rooms for new projects
CREATE OR REPLACE FUNCTION create_default_work_rooms()
RETURNS TRIGGER AS $$
BEGIN
    -- Create default collaboration rooms for new projects
    INSERT INTO work_collaboration_rooms (project_id, name, description, room_type, created_by)
    VALUES 
        (NEW.id, 'General', 'General project discussion and updates', 'general', NEW.owner_id),
        (NEW.id, 'Tasks', 'Task-related discussions and updates', 'tasks', NEW.owner_id),
        (NEW.id, 'Notes', 'Project notes and documentation', 'notes', NEW.owner_id),
        (NEW.id, 'Files', 'File sharing and collaboration', 'files', NEW.owner_id),
        (NEW.id, 'Meetings', 'Meeting notes and discussions', 'meeting', NEW.owner_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically create default rooms
CREATE TRIGGER create_default_work_rooms_trigger
    AFTER INSERT ON projects
    FOR EACH ROW
    EXECUTE FUNCTION create_default_work_rooms(); 