-- Simple: Just add user_id column to project_files table
-- No drops, no RLS changes, no breaking anything

-- Check if user_id column already exists
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'project_files' AND column_name = 'user_id';

-- Add user_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'project_files' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE project_files ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        
        -- Create index for the new column
        CREATE INDEX IF NOT EXISTS idx_project_files_user_id ON project_files(user_id);
        
        RAISE NOTICE 'user_id column added successfully to project_files table';
    ELSE
        RAISE NOTICE 'user_id column already exists in project_files table';
    END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'project_files' 
ORDER BY ordinal_position; 