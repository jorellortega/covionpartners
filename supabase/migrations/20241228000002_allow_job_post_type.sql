-- Allow 'job' as a valid post type in posts table
-- First, check if there's an existing constraint and drop it if it exists
DO $$
BEGIN
    -- Drop existing constraint if it exists
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'posts_type_check' 
        AND conrelid = 'posts'::regclass
    ) THEN
        ALTER TABLE posts DROP CONSTRAINT posts_type_check;
    END IF;
END $$;

-- Add constraint that includes 'job' as a valid type
ALTER TABLE posts 
ADD CONSTRAINT posts_type_check 
CHECK (type IN ('project', 'deal', 'milestone', 'partnership', 'job'));

-- Also update post_details type constraint if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'post_details_type_check' 
        AND conrelid = 'post_details'::regclass
    ) THEN
        ALTER TABLE post_details DROP CONSTRAINT post_details_type_check;
    END IF;
END $$;

-- Add constraint to post_details that includes 'job' as a valid type
ALTER TABLE post_details 
ADD CONSTRAINT post_details_type_check 
CHECK (type IN ('project', 'deal', 'milestone', 'partnership', 'job'));

