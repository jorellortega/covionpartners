-- Migration to make deadline column optional in projects table
BEGIN;

-- Remove NOT NULL constraint from deadline column
ALTER TABLE public.projects 
ALTER COLUMN deadline DROP NOT NULL;

-- Add comment to clarify the column is now optional
COMMENT ON COLUMN public.projects.deadline IS 'Optional deadline for the project. Can be NULL if no deadline is set.';

COMMIT;









