
-- Add targeting and config fields to ad_campaigns
ALTER TABLE public.ad_campaigns
  ADD COLUMN IF NOT EXISTS target_location text DEFAULT 'Brasil',
  ADD COLUMN IF NOT EXISTS target_age_min integer DEFAULT 18,
  ADD COLUMN IF NOT EXISTS target_age_max integer DEFAULT 65,
  ADD COLUMN IF NOT EXISTS target_gender text DEFAULT 'todos',
  ADD COLUMN IF NOT EXISTS target_interests text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS platforms text[] DEFAULT '{Feed,Stories,Reels,Pesquisa}',
  ADD COLUMN IF NOT EXISTS placements_type text DEFAULT 'automatico',
  ADD COLUMN IF NOT EXISTS device_types text DEFAULT 'todos',
  ADD COLUMN IF NOT EXISTS destination_url text,
  ADD COLUMN IF NOT EXISTS destination_type text DEFAULT 'site',
  ADD COLUMN IF NOT EXISTS tracking_pixel_enabled boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS url_params text,
  ADD COLUMN IF NOT EXISTS identity_page text,
  ADD COLUMN IF NOT EXISTS identity_instagram text,
  ADD COLUMN IF NOT EXISTS ad_format text DEFAULT 'imagem',
  ADD COLUMN IF NOT EXISTS creative_source text DEFAULT 'upload_manual',
  ADD COLUMN IF NOT EXISTS schedule_type text DEFAULT 'continuo';

-- Add targeting fields to ad_sets
ALTER TABLE public.ad_sets
  ADD COLUMN IF NOT EXISTS target_location text DEFAULT 'Brasil',
  ADD COLUMN IF NOT EXISTS target_age_min integer DEFAULT 18,
  ADD COLUMN IF NOT EXISTS target_age_max integer DEFAULT 65,
  ADD COLUMN IF NOT EXISTS target_gender text DEFAULT 'todos',
  ADD COLUMN IF NOT EXISTS target_interests text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS placements_type text DEFAULT 'automatico',
  ADD COLUMN IF NOT EXISTS platforms text[] DEFAULT '{Feed,Stories,Reels,Pesquisa}',
  ADD COLUMN IF NOT EXISTS device_types text DEFAULT 'todos',
  ADD COLUMN IF NOT EXISTS schedule_start_time text,
  ADD COLUMN IF NOT EXISTS schedule_end_time text;
