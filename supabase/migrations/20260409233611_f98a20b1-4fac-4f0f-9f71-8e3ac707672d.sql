
CREATE TABLE public.ad_integrations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  platform text NOT NULL,
  access_token text NOT NULL,
  account_id text,
  is_connected boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, platform)
);

ALTER TABLE public.ad_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own ad integrations"
ON public.ad_integrations FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_ad_integrations_updated_at
BEFORE UPDATE ON public.ad_integrations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
