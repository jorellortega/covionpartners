-- Update timeline types to include all 10 types
-- This migration updates the check constraint for the type column in project_timeline table

-- First, drop the existing check constraint if it exists
ALTER TABLE project_timeline 
DROP CONSTRAINT IF EXISTS project_timeline_type_check;

-- Add the new check constraint with all 10 timeline types
ALTER TABLE project_timeline 
ADD CONSTRAINT project_timeline_type_check 
CHECK (type IN (
  'milestone', 
  'objective', 
  'task', 
  'deadline', 
  'plan', 
  'review', 
  'meeting', 
  'deliverable', 
  'research', 
  'other'
));

-- Add comment to document the timeline types
COMMENT ON COLUMN project_timeline.type IS 'Type of timeline item: milestone, objective, task, deadline, plan, review, meeting, deliverable, research, or other'; 