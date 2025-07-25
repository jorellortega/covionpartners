-- Safe way to add user_id column to existing project_files table
-- This won't break existing functionality

-- First, check if user_id column already exists
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
        CREATE INDEX idx_project_files_user_id ON project_files(user_id);
        
        -- Update RLS policies to include user_id checks
        DROP POLICY IF EXISTS "Project files are viewable by project team members" ON project_files;
        CREATE POLICY "Project files are viewable by project team members" ON project_files
        FOR SELECT
        USING (
          EXISTS (
            SELECT 1 FROM team_members tm
            WHERE tm.project_id = project_files.project_id
            AND tm.user_id = auth.uid()
            AND tm.status = 'active'
          )
          OR 
          EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_files.project_id
            AND p.owner_id = auth.uid()
          )
          OR
          project_files.user_id = auth.uid()
        );

        DROP POLICY IF EXISTS "Project files are insertable by project team members" ON project_files;
        CREATE POLICY "Project files are insertable by project team members" ON project_files
        FOR INSERT
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM team_members tm
            WHERE tm.project_id = project_files.project_id
            AND tm.user_id = auth.uid()
            AND tm.status = 'active'
          )
          OR 
          EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_files.project_id
            AND p.owner_id = auth.uid()
          )
          OR
          project_files.user_id = auth.uid()
        );

        DROP POLICY IF EXISTS "Project files are updatable by project team members" ON project_files;
        CREATE POLICY "Project files are updatable by project team members" ON project_files
        FOR UPDATE
        USING (
          EXISTS (
            SELECT 1 FROM team_members tm
            WHERE tm.project_id = project_files.project_id
            AND tm.user_id = auth.uid()
            AND tm.status = 'active'
          )
          OR 
          EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_files.project_id
            AND p.owner_id = auth.uid()
          )
          OR
          project_files.user_id = auth.uid()
        );

        DROP POLICY IF EXISTS "Project files are deletable by project team members" ON project_files;
        CREATE POLICY "Project files are deletable by project team members" ON project_files
        FOR DELETE
        USING (
          EXISTS (
            SELECT 1 FROM team_members tm
            WHERE tm.project_id = project_files.project_id
            AND tm.user_id = auth.uid()
            AND tm.status = 'active'
          )
          OR 
          EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_files.project_id
            AND p.owner_id = auth.uid()
          )
          OR
          project_files.user_id = auth.uid()
        );
        
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