-- Add is_default column to existing profile_media table
ALTER TABLE profile_media 
ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT FALSE;

-- Create index for better performance on is_default queries
CREATE INDEX IF NOT EXISTS idx_profile_media_is_default ON profile_media(is_default);

-- Update existing media to ensure only one is default per profile
-- This prevents multiple default items if the column was added before
UPDATE profile_media 
SET is_default = false 
WHERE id NOT IN (
  SELECT DISTINCT ON (profile_id) id 
  FROM profile_media 
  ORDER BY profile_id, created_at DESC
);
