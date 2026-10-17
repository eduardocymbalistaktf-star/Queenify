
-- Add subscription fields to products
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS billing_type text NOT NULL DEFAULT 'unico',
ADD COLUMN IF NOT EXISTS billing_interval text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS trial_days integer DEFAULT 0;

-- A/B Tests table
CREATE TABLE public.ab_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  campaign_id uuid NOT NULL REFERENCES public.ad_campaigns(id) ON DELETE CASCADE,
  variant_name text NOT NULL,
  variant_config jsonb NOT NULL DEFAULT '{}',
  impressions bigint DEFAULT 0,
  clicks bigint DEFAULT 0,
  conversions integer DEFAULT 0,
  spent numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'ativo',
  is_winner boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ab_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own ab tests"
ON public.ab_tests FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Automated Rules table
CREATE TABLE public.automated_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  campaign_id uuid NOT NULL REFERENCES public.ad_campaigns(id) ON DELETE CASCADE,
  rule_name text NOT NULL,
  condition_type text NOT NULL,
  condition_value numeric NOT NULL DEFAULT 0,
  action_type text NOT NULL,
  action_value text DEFAULT NULL,
  is_active boolean NOT NULL DEFAULT true,
  last_triggered_at timestamptz DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.automated_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own automated rules"
ON public.automated_rules FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
