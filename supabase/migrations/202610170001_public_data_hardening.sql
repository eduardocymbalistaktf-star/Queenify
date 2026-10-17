-- Public pages must use explicitly curated views. Base tables stay private.

DROP POLICY IF EXISTS "Profiles are publicly viewable" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

REVOKE SELECT ON TABLE public.profiles FROM anon;
GRANT SELECT ON TABLE public.profiles TO authenticated;

CREATE OR REPLACE VIEW public.profiles_public
WITH (security_barrier = true, security_invoker = false) AS
SELECT p.user_id, p.display_name, p.avatar_url, p.bio
FROM public.profiles p
JOIN public.platform_settings s ON s.user_id = p.user_id
WHERE COALESCE(s.allow_public_profile, false) = true;

COMMENT ON VIEW public.profiles_public IS
  'Campos públicos mínimos de perfis que optaram por exibição pública.';
GRANT SELECT ON public.profiles_public TO anon, authenticated;

DROP POLICY IF EXISTS "Active products are publicly viewable" ON public.products;
DROP POLICY IF EXISTS "Users can view own products" ON public.products;
CREATE POLICY "Users can view own products"
  ON public.products FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

REVOKE SELECT ON TABLE public.products FROM anon;
GRANT SELECT ON TABLE public.products TO authenticated;

CREATE OR REPLACE VIEW public.products_public
WITH (security_barrier = true, security_invoker = false) AS
SELECT
  id, user_id, name, description, category, price, tags,
  delivery_type, commission_rate, guarantee_days, language,
  niche, sub_niche, image_url, is_active, total_sales,
  billing_type, billing_interval, trial_days,
  created_at, updated_at
FROM public.products
WHERE is_active = true;

COMMENT ON VIEW public.products_public IS
  'Campos selecionados de produtos ativos; campos de tracking e internos permanecem privados.';
GRANT SELECT ON public.products_public TO anon, authenticated;

ALTER TABLE public.platform_settings
  ALTER COLUMN allow_public_profile SET DEFAULT false;
UPDATE public.platform_settings SET allow_public_profile = false
WHERE allow_public_profile IS DISTINCT FROM false;

CREATE OR REPLACE FUNCTION public.get_public_profile_settings(_user_id uuid)
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT json_build_object(
    'theme', us.theme,
    'accent_color', us.accent_color,
    'show_level', us.show_level,
    'show_frame', us.show_frame,
    'bio', us.bio,
    'social_instagram', us.social_instagram,
    'social_youtube', us.social_youtube,
    'social_tiktok', us.social_tiktok
  )
  FROM public.user_settings us
  JOIN public.platform_settings ps ON ps.user_id = us.user_id
  WHERE us.user_id = _user_id
    AND COALESCE(ps.allow_public_profile, false) = true
  LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION public.get_public_profile_settings(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_profile_settings(uuid) TO anon, authenticated;
