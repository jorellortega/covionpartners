-- Add metadata column to work_assignments table
ALTER TABLE work_assignments 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Create index for metadata queries
CREATE INDEX IF NOT EXISTS idx_work_assignments_metadata ON work_assignments USING GIN (metadata); 