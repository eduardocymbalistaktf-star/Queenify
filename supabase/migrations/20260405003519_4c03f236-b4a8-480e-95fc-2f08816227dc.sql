
-- Create ad-creatives storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('ad-creatives', 'ad-creatives', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access
CREATE POLICY "Ad creatives are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'ad-creatives');

-- Users can upload their own creatives
CREATE POLICY "Users can upload their own ad creatives"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'ad-creatives' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can update their own creatives
CREATE POLICY "Users can update their own ad creatives"
ON storage.objects FOR UPDATE
USING (bucket_id = 'ad-creatives' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can delete their own creatives
CREATE POLICY "Users can delete their own ad creatives"
ON storage.objects FOR DELETE
USING (bucket_id = 'ad-creatives' AND auth.uid()::text = (storage.foldername(name))[1]);
