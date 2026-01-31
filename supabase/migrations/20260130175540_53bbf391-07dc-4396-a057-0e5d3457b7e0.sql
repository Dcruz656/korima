-- Add RLS policies for respuestas-docs storage bucket
-- The bucket already exists but needs proper access policies

-- Allow authenticated users to upload response documents to their own folder
CREATE POLICY "Users can upload response documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'respuestas-docs' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to view documents they uploaded
CREATE POLICY "Users can view own response documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'respuestas-docs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow solicitud owners to view response documents for their requests
CREATE POLICY "Solicitud owners can view response documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'respuestas-docs'
  AND EXISTS (
    SELECT 1 FROM public.respuestas r
    JOIN public.solicitudes s ON r.solicitud_id = s.id
    WHERE r.file_url LIKE '%' || storage.filename(name) || '%'
    AND s.user_id = auth.uid()
  )
);

-- Allow admins to view all response documents
CREATE POLICY "Admins can view all response documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'respuestas-docs'
  AND public.is_admin()
);

-- Allow users to delete their own uploaded documents
CREATE POLICY "Users can delete own response documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'respuestas-docs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow admins to delete any response documents
CREATE POLICY "Admins can delete response documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'respuestas-docs'
  AND public.is_admin()
);