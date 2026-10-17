-- Keep payment state and sale values under server-side control.
DROP POLICY IF EXISTS "Users can create own sales" ON public.sales;
DROP POLICY IF EXISTS "Anyone can create sales via checkout" ON public.sales;
DROP POLICY IF EXISTS "Users can update own sales" ON public.sales;
REVOKE INSERT, UPDATE, DELETE ON public.sales FROM anon, authenticated;
ALTER TABLE public.sales ALTER COLUMN status SET DEFAULT 'pending';

-- Enrollment is granted by the verified purchase flow, never by a browser insert.
DROP POLICY IF EXISTS "System can insert enrollments" ON public.student_enrollments;
REVOKE INSERT, UPDATE, DELETE ON public.student_enrollments FROM anon, authenticated;

-- Role and permission RPCs only answer for the caller. Admin status also requires
-- a verified second factor (AAL2), so a password-only session cannot administer roles.
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT auth.uid() = _user_id
    AND (_role <> 'admin' OR auth.jwt() ->> 'aal' = 'aal2')
    AND EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id AND role = _role
    )
$$;

CREATE OR REPLACE FUNCTION public.has_permission(_user_id UUID, _permission TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT auth.uid() = _user_id
    AND EXISTS (
      SELECT 1
      FROM public.user_roles ur
      JOIN public.role_permissions rp ON ur.role = rp.role
      WHERE ur.user_id = _user_id
        AND rp.permission = _permission
        AND rp.enabled = true
        AND (ur.role <> 'admin' OR auth.jwt() ->> 'aal' = 'aal2')
    )
$$;

REVOKE EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_permission(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_permission(UUID, TEXT) TO authenticated;

-- Shared atomic throttle for public edge functions. Only service_role can access it.
CREATE TABLE IF NOT EXISTS public.edge_rate_limits (
  key_hash TEXT PRIMARY KEY CHECK (key_hash ~ '^[a-f0-9]{64}$'),
  window_started_at TIMESTAMPTZ NOT NULL,
  attempt_count INTEGER NOT NULL CHECK (attempt_count > 0)
);
ALTER TABLE public.edge_rate_limits ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS edge_rate_limits_window_idx ON public.edge_rate_limits (window_started_at);
REVOKE ALL ON public.edge_rate_limits FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.edge_rate_limits TO service_role;

CREATE OR REPLACE FUNCTION public.consume_edge_rate_limit(
  p_key_hash TEXT,
  p_limit INTEGER,
  p_window_seconds INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_now TIMESTAMPTZ := clock_timestamp();
  v_attempts INTEGER;
BEGIN
  IF p_key_hash !~ '^[a-f0-9]{64}$' OR p_limit < 1 OR p_limit > 1000 OR p_window_seconds < 1 OR p_window_seconds > 86400 THEN
    RAISE EXCEPTION 'Invalid rate limit parameters';
  END IF;

  INSERT INTO public.edge_rate_limits (key_hash, window_started_at, attempt_count)
  VALUES (p_key_hash, v_now, 1)
  ON CONFLICT (key_hash) DO UPDATE SET
    window_started_at = CASE
      WHEN public.edge_rate_limits.window_started_at + make_interval(secs => p_window_seconds) <= v_now THEN v_now
      ELSE public.edge_rate_limits.window_started_at
    END,
    attempt_count = CASE
      WHEN public.edge_rate_limits.window_started_at + make_interval(secs => p_window_seconds) <= v_now THEN 1
      ELSE public.edge_rate_limits.attempt_count + 1
    END
  RETURNING attempt_count INTO v_attempts;

  DELETE FROM public.edge_rate_limits
  WHERE key_hash IN (
    SELECT key_hash FROM public.edge_rate_limits
    WHERE window_started_at < v_now - INTERVAL '1 day'
    ORDER BY window_started_at
    LIMIT 100
  );

  RETURN v_attempts <= p_limit;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.consume_edge_rate_limit(TEXT, INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_edge_rate_limit(TEXT, INTEGER, INTEGER) TO service_role;
