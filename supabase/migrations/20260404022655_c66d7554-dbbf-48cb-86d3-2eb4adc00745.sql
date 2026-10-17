
-- Tutorial progress tracking
CREATE TABLE public.tutorial_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  step_key text NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, step_key)
);

ALTER TABLE public.tutorial_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress" ON public.tutorial_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progress" ON public.tutorial_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own progress" ON public.tutorial_progress FOR DELETE USING (auth.uid() = user_id);

-- Order bumps
CREATE TABLE public.order_bumps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  bump_product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  discount_percent numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(product_id, bump_product_id)
);

ALTER TABLE public.order_bumps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own order bumps" ON public.order_bumps FOR SELECT
  USING (EXISTS (SELECT 1 FROM products WHERE products.id = order_bumps.product_id AND products.user_id = auth.uid()));
CREATE POLICY "Users can create own order bumps" ON public.order_bumps FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM products WHERE products.id = order_bumps.product_id AND products.user_id = auth.uid()));
CREATE POLICY "Users can update own order bumps" ON public.order_bumps FOR UPDATE
  USING (EXISTS (SELECT 1 FROM products WHERE products.id = order_bumps.product_id AND products.user_id = auth.uid()));
CREATE POLICY "Users can delete own order bumps" ON public.order_bumps FOR DELETE
  USING (EXISTS (SELECT 1 FROM products WHERE products.id = order_bumps.product_id AND products.user_id = auth.uid()));
