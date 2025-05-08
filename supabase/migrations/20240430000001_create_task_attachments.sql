-- Create task_attachments table
CREATE TABLE task_attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('file', 'link')),
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    file_path TEXT,  -- Only for file type attachments
    file_size INTEGER,  -- Only for file type attachments
    file_type TEXT,  -- Only for file type attachments
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_task_attachments_task_id ON task_attachments(task_id);
CREATE INDEX idx_task_attachments_created_by ON task_attachments(created_by);

-- Enable Row Level Security
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view attachments for tasks they have access to"
    ON task_attachments FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM tasks t
            LEFT JOIN team_members tm ON tm.project_id = t.project_id
            WHERE t.id = task_attachments.task_id
            AND (
                t.assigned_to = auth.uid()
                OR tm.user_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM projects p
                    WHERE p.id = t.project_id
                    AND p.owner_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Users can add attachments to tasks they have access to"
    ON task_attachments FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM tasks t
            LEFT JOIN team_members tm ON tm.project_id = t.project_id
            WHERE t.id = task_attachments.task_id
            AND (
                t.assigned_to = auth.uid()
                OR tm.user_id = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM projects p
                    WHERE p.id = t.project_id
                    AND p.owner_id = auth.uid()
                )
            )
        )
        AND created_by = auth.uid()
    );

CREATE POLICY "Users can delete attachments they created"
    ON task_attachments FOR DELETE
    USING (created_by = auth.uid());

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION handle_task_attachment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER set_task_attachment_updated_at
    BEFORE UPDATE ON task_attachments
    FOR EACH ROW
    EXECUTE FUNCTION handle_task_attachment_updated_at(); 