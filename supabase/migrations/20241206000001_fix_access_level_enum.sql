-- Fix missing access_level_enum type
-- Create the enum type if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'access_level_enum') THEN
        CREATE TYPE access_level_enum AS ENUM ('1', '2', '3', '4', '5');
    END IF;
END $$;

-- Update the team_members table to use the correct type
ALTER TABLE team_members 
ALTER COLUMN access_level TYPE access_level_enum 
USING access_level::access_level_enum;

-- Set default value if not already set
ALTER TABLE team_members 
ALTER COLUMN access_level SET DEFAULT '1'::access_level_enum; 