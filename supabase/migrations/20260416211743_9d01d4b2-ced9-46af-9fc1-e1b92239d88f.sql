
ALTER TABLE public.sales 
  ADD COLUMN IF NOT EXISTS mp_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS external_reference TEXT,
  ADD COLUMN IF NOT EXISTS payment_details JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_sales_mp_payment_id ON public.sales(mp_payment_id);
CREATE INDEX IF NOT EXISTS idx_sales_external_reference ON public.sales(external_reference);

-- Permitir UPDATE pelo dono da venda (necessário para reconciliação client-side opcional)
DO $$ BEGIN
  CREATE POLICY "Users can update own sales"
    ON public.sales FOR UPDATE
    USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
