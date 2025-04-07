-- Add visibility column to projects table
ALTER TABLE projects 
ADD COLUMN visibility TEXT NOT NULL DEFAULT 'private' 
CHECK (visibility IN ('private', 'public')); 