
-- Ad campaigns
CREATE TABLE public.ad_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  objective text NOT NULL DEFAULT 'vendas',
  status text NOT NULL DEFAULT 'rascunho',
  budget numeric NOT NULL DEFAULT 0,
  budget_type text NOT NULL DEFAULT 'diário',
  optimization text DEFAULT 'conversao',
  spent numeric DEFAULT 0,
  impressions bigint DEFAULT 0,
  reach bigint DEFAULT 0,
  clicks bigint DEFAULT 0,
  conversions integer DEFAULT 0,
  cost_per_result numeric DEFAULT 0,
  frequency numeric DEFAULT 0,
  start_date date,
  end_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own campaigns" ON public.ad_campaigns FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Ad sets
CREATE TABLE public.ad_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.ad_campaigns(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'rascunho',
  audience text DEFAULT '',
  placement text DEFAULT 'Automático',
  budget numeric DEFAULT 0,
  spent numeric DEFAULT 0,
  impressions bigint DEFAULT 0,
  clicks bigint DEFAULT 0,
  conversions integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ad_sets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own ad sets" ON public.ad_sets FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Ads
CREATE TABLE public.ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_set_id uuid NOT NULL REFERENCES public.ad_sets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'rascunho',
  format text DEFAULT 'Imagem',
  creative_url text,
  impressions bigint DEFAULT 0,
  clicks bigint DEFAULT 0,
  ctr numeric DEFAULT 0,
  conversions integer DEFAULT 0,
  spent numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own ads" ON public.ads FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Timestamps trigger
CREATE TRIGGER update_ad_campaigns_updated_at BEFORE UPDATE ON public.ad_campaigns
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
