CREATE TABLE IF NOT EXISTS public.ads_oauth_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('facebook', 'google')),
  state_hash text NOT NULL UNIQUE,
  frontend_origin text NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '10 minutes'),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ads_oauth_states ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.ads_oauth_states FROM anon, authenticated;
GRANT ALL ON TABLE public.ads_oauth_states TO service_role;

CREATE INDEX IF NOT EXISTS idx_ads_oauth_states_expiry
  ON public.ads_oauth_states (expires_at);
