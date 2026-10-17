CREATE TABLE IF NOT EXISTS public.email_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  preheader TEXT NOT NULL DEFAULT '',
  sender_name TEXT NOT NULL DEFAULT 'Queenify',
  sender_email TEXT NOT NULL DEFAULT '',
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  blocks JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status = 'rascunho'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT email_campaigns_blocks_array CHECK (jsonb_typeof(blocks) = 'array')
);

ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own email campaigns" ON public.email_campaigns;
CREATE POLICY "Users manage own email campaigns"
  ON public.email_campaigns
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_campaigns TO authenticated;
