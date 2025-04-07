-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to view partner files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload partner files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update partner files" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete partner files" ON storage.objects;

-- Create storage policies for partnerfiles bucket
CREATE POLICY "Allow authenticated users to view partner files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'partnerfiles');

CREATE POLICY "Allow authenticated users to upload partner files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'partnerfiles'
);

CREATE POLICY "Allow authenticated users to update partner files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'partnerfiles');

CREATE POLICY "Allow authenticated users to delete partner files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'partnerfiles'); 