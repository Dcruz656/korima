-- Create storage bucket for response documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'respuestas-docs', 
  'respuestas-docs', 
  false,
  8388608, -- 8MB limit
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- Policy: Users can upload their own files
CREATE POLICY "Users can upload response docs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'respuestas-docs' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Response owner can view their uploaded files
CREATE POLICY "Response owners can view their docs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'respuestas-docs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Solicitud owner can view response docs for their requests
CREATE POLICY "Solicitud owners can view response docs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'respuestas-docs'
  AND EXISTS (
    SELECT 1 FROM public.respuestas r
    JOIN public.solicitudes s ON r.solicitud_id = s.id
    WHERE r.file_url LIKE '%' || storage.objects.name
    AND s.user_id = auth.uid()
  )
);

-- Policy: Admins can view all docs
CREATE POLICY "Admins can view all response docs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'respuestas-docs'
  AND public.is_admin()
);

-- Policy: Users can delete their own files
CREATE POLICY "Users can delete own response docs"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'respuestas-docs'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Admins can delete any docs (for cleanup)
CREATE POLICY "Admins can delete any response docs"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'respuestas-docs'
  AND public.is_admin()
);