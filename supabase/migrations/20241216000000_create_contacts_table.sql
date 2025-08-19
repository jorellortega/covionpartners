-- Create contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  company VARCHAR(255),
  position VARCHAR(255),
  website VARCHAR(500),
  address TEXT,
  notes TEXT,
  category VARCHAR(50) CHECK (category IN ('business', 'personal', 'client', 'vendor', 'other')) DEFAULT 'business',
  is_favorite BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_category ON contacts(category);
CREATE INDEX IF NOT EXISTS idx_contacts_is_favorite ON contacts(is_favorite);
CREATE INDEX IF NOT EXISTS idx_contacts_name ON contacts(name);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_company ON contacts(company);
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON contacts(created_at);

-- Enable Row Level Security
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own contacts" ON contacts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own contacts" ON contacts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contacts" ON contacts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contacts" ON contacts
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_contacts_updated_at();

-- Create function to search contacts
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
  position VARCHAR(255),
  website VARCHAR(500),
  address TEXT,
  notes TEXT,
  category VARCHAR(50),
  is_favorite BOOLEAN,
  tags TEXT[],
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
    c.position,
    c.website,
    c.address,
    c.notes,
    c.category,
    c.is_favorite,
    c.tags,
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
      OR c.position ILIKE '%' || search_query || '%'
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

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON contacts TO authenticated;
GRANT EXECUTE ON FUNCTION search_contacts(UUID, TEXT, TEXT, BOOLEAN) TO authenticated;

-- Insert some sample data for testing (optional)
-- This can be removed in production
INSERT INTO contacts (user_id, name, email, phone, company, position, website, address, notes, category, is_favorite, tags) VALUES
  (
    (SELECT id FROM auth.users LIMIT 1),
    'Sarah Johnson',
    'sarah.johnson@techcorp.com',
    '+1 (555) 123-4567',
    'TechCorp Solutions',
    'Senior Developer',
    'https://techcorp.com',
    '123 Tech Street, San Francisco, CA 94105',
    'Great collaboration on the mobile app project. Very responsive and detail-oriented.',
    'business',
    true,
    ARRAY['developer', 'mobile', 'react', 'team']
  ),
  (
    (SELECT id FROM auth.users LIMIT 1),
    'Mike Chen',
    'mike.chen@designstudio.co',
    '+1 (555) 987-6543',
    'Creative Design Studio',
    'UX Designer',
    'https://designstudio.co',
    '456 Design Ave, New York, NY 10001',
    'Excellent eye for user experience. Worked on several successful projects together.',
    'client',
    true,
    ARRAY['designer', 'ux', 'creative', 'contractor']
  );



