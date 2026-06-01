INSERT INTO storage.buckets (id, name, public) VALUES ('downloads', 'downloads', true) ON CONFLICT (id) DO UPDATE SET public = true;

CREATE POLICY "Downloads are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'downloads');