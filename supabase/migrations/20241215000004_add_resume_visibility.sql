-- Add resume visibility field to profiles table
ALTER TABLE profiles 
ADD COLUMN resume_visible BOOLEAN DEFAULT true;

-- Add comment for documentation
COMMENT ON COLUMN profiles.resume_visible IS 'Controls whether the resume section is visible on the profile page';
