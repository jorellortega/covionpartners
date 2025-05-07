-- Add parent_id column to messages table
ALTER TABLE messages
ADD COLUMN parent_id INTEGER REFERENCES messages(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS messages_parent_id_idx ON messages(parent_id);

-- Add comment to explain the column
COMMENT ON COLUMN messages.parent_id IS 'References the parent message in a thread. NULL for root messages.'; 