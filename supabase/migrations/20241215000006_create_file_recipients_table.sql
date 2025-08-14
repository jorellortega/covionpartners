-- Create file_recipients table for tracking who files are sent to
CREATE TABLE IF NOT EXISTS file_recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_share_id UUID NOT NULL REFERENCES file_shares(id) ON DELETE CASCADE,
    recipient_name VARCHAR(255) NOT NULL,
    recipient_phone VARCHAR(50),
    custom_message TEXT,
    access_code VARCHAR(10), -- Optional access code for security
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    accessed_at TIMESTAMP WITH TIME ZONE,
    download_count INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active' -- active, expired, accessed
);

-- Create indexes for better performance
CREATE INDEX idx_file_recipients_file_share_id ON file_recipients(file_share_id);
CREATE INDEX idx_file_recipients_access_code ON file_recipients(access_code);
CREATE INDEX idx_file_recipients_status ON file_recipients(status);
CREATE INDEX idx_file_recipients_expires_at ON file_recipients(expires_at);

-- Enable Row Level Security
ALTER TABLE file_recipients ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for file_recipients
CREATE POLICY "File recipients are viewable by file share owner" ON file_recipients
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM file_shares fs
    WHERE fs.id = file_recipients.file_share_id
    AND fs.sender_email = 'noreply@covionpartners.com' -- This indicates it's from the system
  )
);

CREATE POLICY "File recipients are insertable by authenticated users" ON file_recipients
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "File recipients are updatable by file share owner" ON file_recipients
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM file_shares fs
    WHERE fs.id = file_recipients.file_share_id
    AND fs.sender_email = 'noreply@covionpartners.com'
  )
);

-- Add comment
COMMENT ON TABLE file_recipients IS 'Tracks individual recipients for file shares, allowing personalized access and tracking';
