-- Add task_id column to project_files table
-- This allows linking files to specific tasks

-- Check if task_id column already exists
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'project_files' AND column_name = 'task_id';

-- Add task_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'project_files' AND column_name = 'task_id'
    ) THEN
        ALTER TABLE project_files ADD COLUMN task_id UUID REFERENCES tasks(id) ON DELETE SET NULL;
        
        -- Create index for the new column
        CREATE INDEX IF NOT EXISTS idx_project_files_task_id ON project_files(task_id);
        
        RAISE NOTICE 'task_id column added successfully to project_files table';
    ELSE
        RAISE NOTICE 'task_id column already exists in project_files table';
    END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'project_files' 
ORDER BY ordinal_position; 