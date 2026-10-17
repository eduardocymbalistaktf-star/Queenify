
CREATE TABLE public.weekly_competitions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  week_start DATE NOT NULL,
  winner_user_id UUID NOT NULL,
  winner_product_id UUID NOT NULL,
  total_sales_amount NUMERIC NOT NULL DEFAULT 0,
  total_sales_count INTEGER NOT NULL DEFAULT 0,
  stars_earned INTEGER NOT NULL DEFAULT 1,
  boost_awarded BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(week_start)
);
ALTER TABLE public.weekly_competitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view competitions" ON public.weekly_competitions FOR SELECT USING (true);

CREATE TABLE public.user_competition_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  total_stars INTEGER NOT NULL DEFAULT 0,
  has_top1_badge BOOLEAN NOT NULL DEFAULT false,
  cooldown_until DATE,
  level_at_win TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.user_competition_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own stats" ON public.user_competition_stats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users manage own stats" ON public.user_competition_stats FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.chargebacks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sale_id UUID NOT NULL,
  product_id UUID NOT NULL,
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  negative_balance NUMERIC NOT NULL DEFAULT 0,
  serasa_deadline TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.chargebacks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own chargebacks" ON public.chargebacks FOR SELECT USING (auth.uid() = user_id);

CREATE TABLE public.boost_purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan_id TEXT NOT NULL,
  product_id UUID,
  price_paid NUMERIC NOT NULL DEFAULT 0,
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  auto_renew BOOLEAN NOT NULL DEFAULT false,
  payment_method TEXT NOT NULL DEFAULT 'pix',
  renewal_status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.boost_purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own boosts" ON public.boost_purchases FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.chargebacks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.sales;
