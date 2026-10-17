
CREATE TABLE public.checkout_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  theme text NOT NULL DEFAULT 'dark',
  primary_color text DEFAULT '#D4A843',
  secondary_color text DEFAULT '#1a1a1a',
  accent_color text DEFAULT '#D4A843',
  logo_url text DEFAULT NULL,
  banner_url text DEFAULT NULL,
  show_guarantee_badge boolean NOT NULL DEFAULT true,
  show_security_badge boolean NOT NULL DEFAULT true,
  show_testimonials boolean NOT NULL DEFAULT false,
  custom_cta_text text DEFAULT 'Comprar agora',
  custom_header_text text DEFAULT NULL,
  urgency_enabled boolean NOT NULL DEFAULT false,
  urgency_text text DEFAULT 'Oferta por tempo limitado!',
  countdown_enabled boolean NOT NULL DEFAULT false,
  countdown_minutes integer DEFAULT 15,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(product_id)
);

ALTER TABLE public.checkout_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own checkout settings"
ON public.checkout_settings FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public can view checkout settings"
ON public.checkout_settings FOR SELECT
TO anon
USING (true);

CREATE TRIGGER update_checkout_settings_updated_at
BEFORE UPDATE ON public.checkout_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
