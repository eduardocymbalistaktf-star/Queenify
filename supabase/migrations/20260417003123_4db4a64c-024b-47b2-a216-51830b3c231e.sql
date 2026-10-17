-- External webhook tokens for receiving sales from Hotmart, Kirvano, etc.
CREATE TABLE public.external_webhook_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  token text NOT NULL UNIQUE DEFAULT encode(extensions.gen_random_bytes(24), 'hex'),
  source text NOT NULL DEFAULT 'generic',
  is_active boolean NOT NULL DEFAULT true,
  last_received_at timestamptz,
  total_received integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.external_webhook_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own webhook tokens"
  ON public.external_webhook_tokens
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_external_webhook_tokens_token ON public.external_webhook_tokens(token);

-- Allow tracking_events status update (so retries can update existing rows OR we just insert new — let's allow update for retries)
CREATE POLICY "Users update own tracking events"
  ON public.tracking_events
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Mark sale source for external imports
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS external_source text;