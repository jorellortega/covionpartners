-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can view partner files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload partner files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update their own partner files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete their own partner files" ON storage.objects;

-- Recreate policies with updated conditions
CREATE POLICY "Authenticated users can view partner files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'partnerfiles');

CREATE POLICY "Authenticated users can upload partner files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'partnerfiles'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Authenticated users can update their own partner files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'partnerfiles'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Authenticated users can delete their own partner files"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'partnerfiles'
    AND (storage.foldername(name))[1] = auth.uid()::text
); 