-- Create profile_media table
CREATE TABLE IF NOT EXISTS profile_media (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('image', 'video')),
  url TEXT NOT NULL,
  title TEXT,
  thumbnail TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profile_media_profile_id ON profile_media(profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_media_user_id ON profile_media(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_media_is_default ON profile_media(is_default);

-- Enable Row Level Security
ALTER TABLE profile_media ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Profile media is viewable by everyone"
  ON profile_media FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile media"
  ON profile_media FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile media"
  ON profile_media FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profile media"
  ON profile_media FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_profile_media_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_profile_media_updated_at
  BEFORE UPDATE ON profile_media
  FOR EACH ROW EXECUTE FUNCTION update_profile_media_updated_at();
