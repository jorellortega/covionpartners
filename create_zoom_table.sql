-- Create table for storing Zoom OAuth tokens
CREATE TABLE IF NOT EXISTS user_zoom_auth (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  zoom_user_id VARCHAR(255) NOT NULL,
  zoom_email VARCHAR(255) NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_zoom_auth_user_id ON user_zoom_auth(user_id);
CREATE INDEX IF NOT EXISTS idx_user_zoom_auth_zoom_user_id ON user_zoom_auth(zoom_user_id);

-- Enable RLS
ALTER TABLE user_zoom_auth ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own zoom auth" ON user_zoom_auth
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own zoom auth" ON user_zoom_auth
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own zoom auth" ON user_zoom_auth
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own zoom auth" ON user_zoom_auth
  FOR DELETE USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_user_zoom_auth_updated_at
  BEFORE UPDATE ON user_zoom_auth
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 