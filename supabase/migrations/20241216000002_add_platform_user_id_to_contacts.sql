-- Add platform_user_id column to contacts table
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS platform_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for better performance when querying platform users
CREATE INDEX IF NOT EXISTS idx_contacts_platform_user_id ON contacts(platform_user_id);

-- Update the search function to include platform_user_id
CREATE OR REPLACE FUNCTION search_contacts(
  search_user_id UUID,
  search_query TEXT,
  search_category TEXT DEFAULT NULL,
  search_favorites_only BOOLEAN DEFAULT false
)
RETURNS TABLE (
  id UUID,
  name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  company VARCHAR(255),
  "position" VARCHAR(255),
  website VARCHAR(500),
  address TEXT,
  notes TEXT,
  category VARCHAR(50),
  is_favorite BOOLEAN,
  tags TEXT[],
  platform_user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.email,
    c.phone,
    c.company,
    c."position",
    c.website,
    c.address,
    c.notes,
    c.category,
    c.is_favorite,
    c.tags,
    c.platform_user_id,
    c.created_at,
    c.updated_at
  FROM contacts c
  WHERE c.user_id = search_user_id
    AND (
      search_query IS NULL 
      OR search_query = ''
      OR c.name ILIKE '%' || search_query || '%'
      OR c.email ILIKE '%' || search_query || '%'
      OR c.company ILIKE '%' || search_query || '%'
      OR c."position" ILIKE '%' || search_query || '%'
      OR EXISTS (
        SELECT 1 FROM unnest(c.tags) tag 
        WHERE tag ILIKE '%' || search_query || '%'
      )
    )
    AND (
      search_category IS NULL 
      OR search_category = 'all'
      OR c.category = search_category
    )
    AND (
      NOT search_favorites_only 
      OR c.is_favorite = true
    )
  ORDER BY 
    c.is_favorite DESC,
    c.name ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;





