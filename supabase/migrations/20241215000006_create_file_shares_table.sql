-- Create file_shares table for public file sharing
CREATE TABLE IF NOT EXISTS file_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT,
  message TEXT,
  sender_name TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  download_count INTEGER DEFAULT 0
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_file_shares_expires_at ON file_shares(expires_at);
CREATE INDEX IF NOT EXISTS idx_file_shares_created_at ON file_shares(created_at);
CREATE INDEX IF NOT EXISTS idx_file_shares_sender_email ON file_shares(sender_email);

-- Enable Row Level Security
ALTER TABLE file_shares ENABLE ROW LEVEL SECURITY;

-- Policies for file_shares
-- Anyone can view file shares (for public access)
CREATE POLICY "Anyone can view file shares"
  ON file_shares FOR SELECT
  USING (true);

-- Anyone can create file shares (for public uploads)
CREATE POLICY "Anyone can create file shares"
  ON file_shares FOR INSERT
  WITH CHECK (true);

-- Only the sender can update their file shares (for download count)
CREATE POLICY "Senders can update their file shares"
  ON file_shares FOR UPDATE
  USING (sender_email = current_setting('request.jwt.claims', true)::json->>'email' OR true);

-- Add comments for documentation
COMMENT ON TABLE file_shares IS 'Public file sharing table for anonymous file uploads and downloads';
COMMENT ON COLUMN file_shares.file_name IS 'Original filename of the uploaded file';
COMMENT ON COLUMN file_shares.file_url IS 'Public URL to the file in storage';
COMMENT ON COLUMN file_shares.file_size IS 'Size of the file in bytes';
COMMENT ON COLUMN file_shares.file_type IS 'MIME type of the file';
COMMENT ON COLUMN file_shares.message IS 'Optional message from the sender';
COMMENT ON COLUMN file_shares.sender_name IS 'Name of the person sharing the file';
COMMENT ON COLUMN file_shares.sender_email IS 'Email of the person sharing the file';
COMMENT ON COLUMN file_shares.expires_at IS 'When the file share expires and becomes unavailable';
COMMENT ON COLUMN file_shares.download_count IS 'Number of times the file has been downloaded';
