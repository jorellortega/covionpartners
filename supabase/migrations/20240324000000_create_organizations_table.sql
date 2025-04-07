-- Create organizations table if it doesn't exist
CREATE TABLE IF NOT EXISTS organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  website TEXT,
  industry TEXT NOT NULL,
  size TEXT NOT NULL,
  location TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Organizations are viewable by authenticated users" ON organizations;
DROP POLICY IF EXISTS "Organizations are editable by owner" ON organizations;
DROP POLICY IF EXISTS "Organizations can be created by authenticated users" ON organizations;
DROP POLICY IF EXISTS "Organizations can be deleted by owner" ON organizations;

-- Create policies
CREATE POLICY "Organizations are viewable by authenticated users"
ON organizations FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Organizations are editable by owner"
ON organizations FOR UPDATE
TO authenticated
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Organizations can be created by authenticated users"
ON organizations FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Organizations can be deleted by owner"
ON organizations FOR DELETE
TO authenticated
USING (auth.uid() = owner_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_organizations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_organizations_updated_at(); 