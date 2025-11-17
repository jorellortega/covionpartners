-- Create storage bucket for contracts
-- This migration creates the 'contracts' bucket and sets up RLS policies

-- Insert bucket into storage.buckets (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'contracts',
  'contracts',
  true,
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for the contracts bucket
-- Policy: Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload contract files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'contracts' AND
  auth.role() = 'authenticated'
);

-- Policy: Allow authenticated users to view contract files
CREATE POLICY "Authenticated users can view contract files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'contracts' AND
  auth.role() = 'authenticated'
);

-- Policy: Allow authenticated users to update their own contract files
CREATE POLICY "Authenticated users can update contract files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'contracts' AND
  auth.role() = 'authenticated'
)
WITH CHECK (
  bucket_id = 'contracts' AND
  auth.role() = 'authenticated'
);

-- Policy: Allow authenticated users to delete contract files
CREATE POLICY "Authenticated users can delete contract files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'contracts' AND
  auth.role() = 'authenticated'
);

