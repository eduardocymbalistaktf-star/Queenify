CREATE TABLE public.security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  severity text NOT NULL DEFAULT 'info',
  description text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  user_id uuid,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_severity CHECK (severity IN ('info','warning','error','critical')),
  CONSTRAINT valid_event_type CHECK (event_type IN (
    'hibp_blocked','rls_denied','cors_denied','auth_failed',
    'rate_limit_hit','suspicious_query','unauthorized_access','other'
  ))
);

CREATE INDEX idx_security_events_created ON public.security_events(created_at DESC);
CREATE INDEX idx_security_events_type ON public.security_events(event_type);
CREATE INDEX idx_security_events_severity ON public.security_events(severity);

ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view all security events"
  ON public.security_events FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can insert security events"
  ON public.security_events FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    length(description) > 0
    AND length(description) <= 1000
    AND (user_id IS NULL OR user_id = auth.uid() OR auth.role() = 'service_role')
  );