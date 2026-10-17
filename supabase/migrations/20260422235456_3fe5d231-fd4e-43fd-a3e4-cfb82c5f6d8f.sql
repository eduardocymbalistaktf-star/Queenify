-- 1) user_competition_stats: bloquear UPDATE/INSERT/DELETE direto pelo usuário
DROP POLICY IF EXISTS "Users manage own stats" ON public.user_competition_stats;
DROP POLICY IF EXISTS "Users view own stats" ON public.user_competition_stats;

CREATE POLICY "Users view own competition stats"
  ON public.user_competition_stats
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
-- Sem políticas de INSERT/UPDATE/DELETE: só service_role (server-side) escreve.

-- 2) tracking_pixels: esconder access_token via view + RPC
CREATE OR REPLACE VIEW public.tracking_pixels_safe
WITH (security_invoker = on) AS
SELECT
  id, user_id, platform, pixel_id, conversion_label,
  is_active, last_event_at, events_sent_count,
  test_event_code, created_at, updated_at
FROM public.tracking_pixels;

COMMENT ON VIEW public.tracking_pixels_safe IS
  'Exposição segura de tracking_pixels sem o access_token. Use sempre esta view no frontend.';

-- 3) products: view pública sem tracking_pixel
CREATE OR REPLACE VIEW public.products_public
WITH (security_invoker = on) AS
SELECT
  id, user_id, name, description, category, price, tags,
  delivery_type, commission_rate, guarantee_days, language,
  niche, sub_niche, image_url, is_active, total_sales,
  billing_type, billing_interval, trial_days,
  created_at, updated_at
FROM public.products
WHERE is_active = true;

COMMENT ON VIEW public.products_public IS
  'Listagem pública de produtos ativos sem expor tracking_pixel. Use no marketplace e perfis públicos.';

-- 4) weekly_competitions: restringir a usuários autenticados
DROP POLICY IF EXISTS "Anyone can view competitions" ON public.weekly_competitions;
DROP POLICY IF EXISTS "Public can view competitions" ON public.weekly_competitions;
DROP POLICY IF EXISTS "Weekly competitions are publicly viewable" ON public.weekly_competitions;

CREATE POLICY "Authenticated users view competitions"
  ON public.weekly_competitions
  FOR SELECT
  TO authenticated
  USING (true);

-- 5) collaboration_invites: esconder invite_token e expor via RPC
CREATE OR REPLACE FUNCTION public.get_invite_by_token(_token text)
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'id', id,
    'inviter_id', inviter_id,
    'invitee_email', invitee_email,
    'role', role,
    'share_percentage', share_percentage,
    'message', message,
    'status', status,
    'created_at', created_at
  )
  FROM public.collaboration_invites
  WHERE invite_token = _token
    AND status = 'pendente'
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.get_invite_by_token IS
  'Valida um convite pelo token sem expor o token em listagens. Use na página de aceite do convite.';