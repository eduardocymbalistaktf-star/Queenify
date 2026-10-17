CREATE TABLE public.platform_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  -- Permissions
  allow_public_profile boolean DEFAULT true,
  allow_affiliate_requests boolean DEFAULT true,
  allow_email_marketing boolean DEFAULT false,
  allow_collaboration boolean DEFAULT true,
  -- Ad Security (Meta/Google Ads compliance)
  ad_auto_review boolean DEFAULT true,
  ad_block_prohibited boolean DEFAULT true,
  ad_require_landing_page boolean DEFAULT true,
  ad_max_daily_budget numeric DEFAULT 5000,
  ad_block_misleading boolean DEFAULT true,
  ad_require_disclaimer boolean DEFAULT false,
  ad_block_adult_content boolean DEFAULT true,
  ad_block_health_claims boolean DEFAULT true,
  ad_block_financial_promises boolean DEFAULT true,
  ad_pixel_verification boolean DEFAULT true,
  -- Financial config
  withdrawal_min_amount numeric DEFAULT 20,
  withdrawal_cooldown_hours integer DEFAULT 24,
  anti_fraud_enabled boolean DEFAULT true,
  chargeback_auto_block boolean DEFAULT true,
  max_refund_rate numeric DEFAULT 10,
  escrow_days integer DEFAULT 14,
  auto_payout boolean DEFAULT false,
  require_kyc_above numeric DEFAULT 1000,
  -- Metadata
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own platform settings"
ON public.platform_settings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users create own platform settings"
ON public.platform_settings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own platform settings"
ON public.platform_settings FOR UPDATE
USING (auth.uid() = user_id);

CREATE TRIGGER update_platform_settings_updated_at
BEFORE UPDATE ON public.platform_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();