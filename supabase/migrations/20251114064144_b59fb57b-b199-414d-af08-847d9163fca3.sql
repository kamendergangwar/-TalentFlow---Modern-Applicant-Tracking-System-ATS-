-- Create storage bucket for candidate resume files
INSERT INTO storage.buckets (id, name, public)
VALUES ('candidate-files', 'candidate-files', true);

-- Storage policies for candidate resume files
CREATE POLICY "Public users can view candidate files"
ON storage.objects FOR SELECT
USING (bucket_id = 'candidate-files');

CREATE POLICY "Anyone can upload candidate files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'candidate-files');

CREATE POLICY "Authenticated users can delete candidate files"
ON storage.objects FOR DELETE
USING (bucket_id = 'candidate-files' AND auth.uid() IS NOT NULL);
