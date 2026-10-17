-- 1) weekly_competitions: trocar USING(true) por checagem explícita de auth
DROP POLICY IF EXISTS "Authenticated users view competitions" ON public.weekly_competitions;

CREATE POLICY "Authenticated users view competitions"
  ON public.weekly_competitions
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- 2) Storage: impedir LIST nos buckets públicos (mantém GET por URL direta)
-- Remove qualquer policy ampla de SELECT em storage.objects desses buckets
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Product images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Ad creatives are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view ad creatives" ON storage.objects;

-- Política única: leitura pública SOMENTE quando o caminho do objeto é fornecido
-- (Supabase Storage usa public URL via signed token quando bucket.public=true,
-- então removemos o SELECT amplo e os arquivos continuam servidos pelo CDN.)
-- Para o dono fazer upload/listar os próprios arquivos:
CREATE POLICY "Owners list own files in avatars"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Owners list own files in product-images"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Owners list own files in ad-creatives"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'ad-creatives' AND auth.uid()::text = (storage.foldername(name))[1]);