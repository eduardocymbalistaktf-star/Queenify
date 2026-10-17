
-- Products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  category TEXT DEFAULT '',
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  delivery_type TEXT DEFAULT 'queenify',
  commission_rate NUMERIC(5,2) DEFAULT 50,
  guarantee_days INTEGER DEFAULT 7,
  language TEXT DEFAULT 'pt-BR',
  niche TEXT DEFAULT '',
  sub_niche TEXT DEFAULT '',
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  total_sales INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own products" ON public.products
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own products" ON public.products
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own products" ON public.products
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own products" ON public.products
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Checkout links table
CREATE TABLE public.checkout_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Checkout Principal',
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.checkout_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own checkout links" ON public.checkout_links
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own checkout links" ON public.checkout_links
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own checkout links" ON public.checkout_links
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own checkout links" ON public.checkout_links
  FOR DELETE USING (auth.uid() = user_id);

-- Sales table
CREATE TABLE public.sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  buyer_email TEXT NOT NULL,
  buyer_name TEXT DEFAULT '',
  amount NUMERIC(10,2) NOT NULL,
  commission_amount NUMERIC(10,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'completed',
  payment_method TEXT DEFAULT 'pix',
  affiliate_name TEXT,
  sold_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sales" ON public.sales
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own sales" ON public.sales
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User settings table
CREATE TABLE public.user_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  pix_key TEXT,
  pix_key_type TEXT DEFAULT 'cpf',
  bank_name TEXT,
  bank_agency TEXT,
  bank_account TEXT,
  custom_domain TEXT,
  domain_verified BOOLEAN DEFAULT false,
  two_factor_enabled BOOLEAN DEFAULT false,
  notification_preferences JSONB DEFAULT '{"vendas_email": true, "vendas_push": true, "afiliados_email": true, "afiliados_push": false, "sistema_email": true, "sistema_push": true}'::jsonb,
  bio TEXT DEFAULT '',
  social_instagram TEXT DEFAULT '',
  social_youtube TEXT DEFAULT '',
  social_tiktok TEXT DEFAULT '',
  show_level BOOLEAN DEFAULT true,
  show_frame BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings" ON public.user_settings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own settings" ON public.user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON public.user_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create user_settings on signup (update existing trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;
