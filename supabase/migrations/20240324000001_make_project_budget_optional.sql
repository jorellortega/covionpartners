-- Make budget field optional in projects table
ALTER TABLE projects
ALTER COLUMN budget DROP NOT NULL; 