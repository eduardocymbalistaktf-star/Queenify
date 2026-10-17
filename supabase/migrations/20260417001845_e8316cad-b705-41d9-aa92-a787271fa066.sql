
-- Drop old ads tables
DROP TABLE IF EXISTS public.ab_tests CASCADE;
DROP TABLE IF EXISTS public.automated_rules CASCADE;
DROP TABLE IF EXISTS public.ads CASCADE;
DROP TABLE IF EXISTS public.ad_sets CASCADE;
DROP TABLE IF EXISTS public.ad_campaigns CASCADE;
DROP TABLE IF EXISTS public.ad_integrations CASCADE;

-- Add UTM columns to sales
ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS utm_source text,
  ADD COLUMN IF NOT EXISTS utm_medium text,
  ADD COLUMN IF NOT EXISTS utm_campaign text,
  ADD COLUMN IF NOT EXISTS utm_content text,
  ADD COLUMN IF NOT EXISTS utm_term text,
  ADD COLUMN IF NOT EXISTS fbclid text,
  ADD COLUMN IF NOT EXISTS gclid text,
  ADD COLUMN IF NOT EXISTS ttclid text,
  ADD COLUMN IF NOT EXISTS landing_url text;

CREATE INDEX IF NOT EXISTS idx_sales_utm_campaign ON public.sales(user_id, utm_campaign);
CREATE INDEX IF NOT EXISTS idx_sales_utm_source ON public.sales(user_id, utm_source);

-- tracking_campaigns: manual costs per campaign
CREATE TABLE public.tracking_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  utm_source text,
  utm_medium text,
  utm_campaign text NOT NULL,
  platform text NOT NULL DEFAULT 'facebook', -- facebook | google | tiktok | other
  daily_budget numeric DEFAULT 0,
  total_spent numeric DEFAULT 0,
  start_date date DEFAULT CURRENT_DATE,
  end_date date,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tracking_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own tracking campaigns" ON public.tracking_campaigns
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_tracking_campaigns_updated_at BEFORE UPDATE ON public.tracking_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- tracking_costs: daily spend log
CREATE TABLE public.tracking_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  campaign_id uuid REFERENCES public.tracking_campaigns(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  amount numeric NOT NULL DEFAULT 0,
  impressions bigint DEFAULT 0,
  clicks bigint DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tracking_costs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own tracking costs" ON public.tracking_costs
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_tracking_costs_user_date ON public.tracking_costs(user_id, date);

-- tracking_pixels: per-platform pixel config (Facebook CAPI, Google, TikTok)
CREATE TABLE public.tracking_pixels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  platform text NOT NULL, -- 'facebook' | 'google' | 'tiktok'
  pixel_id text NOT NULL,
  access_token text NOT NULL,
  conversion_label text, -- google only
  test_event_code text,  -- facebook only (for testing)
  is_active boolean NOT NULL DEFAULT true,
  last_event_at timestamptz,
  events_sent_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, platform)
);

ALTER TABLE public.tracking_pixels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own tracking pixels" ON public.tracking_pixels
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_tracking_pixels_updated_at BEFORE UPDATE ON public.tracking_pixels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- tracking_events: log of fired server-side conversions
CREATE TABLE public.tracking_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  sale_id uuid,
  platform text NOT NULL,
  event_name text NOT NULL DEFAULT 'Purchase',
  status text NOT NULL DEFAULT 'pending', -- pending | sent | failed
  response jsonb DEFAULT '{}'::jsonb,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tracking_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own tracking events" ON public.tracking_events
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "System inserts tracking events" ON public.tracking_events
  FOR INSERT WITH CHECK (true);

CREATE INDEX idx_tracking_events_user ON public.tracking_events(user_id, created_at DESC);
