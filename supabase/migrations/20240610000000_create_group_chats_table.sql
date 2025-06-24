-- Create group_chats table for group chat functionality
CREATE TABLE IF NOT EXISTS group_chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    avatar_url TEXT,
    is_private BOOLEAN DEFAULT false,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for faster queries on creator
CREATE INDEX IF NOT EXISTS group_chats_created_by_idx ON group_chats(created_by);

-- Enable Row Level Security
ALTER TABLE group_chats ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all public group chats or private ones they created
CREATE POLICY "Users can view public or owned group chats"
    ON group_chats FOR SELECT
    USING (
        is_private = false OR created_by = auth.uid()
    );

-- Policy: Users can create group chats
CREATE POLICY "Users can create group chats"
    ON group_chats FOR INSERT
    WITH CHECK (auth.uid() = created_by);

-- Policy: Users can update or delete their own group chats
CREATE POLICY "Users can update or delete their own group chats"
    ON group_chats FOR UPDATE USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can delete their own group chats"
    ON group_chats FOR DELETE USING (auth.uid() = created_by);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_group_chats_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_group_chats_updated_at
    BEFORE UPDATE ON group_chats
    FOR EACH ROW
    EXECUTE FUNCTION update_group_chats_updated_at(); 