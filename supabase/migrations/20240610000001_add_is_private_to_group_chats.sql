-- Add is_private column to group_chats if it does not exist
ALTER TABLE group_chats
ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false; 