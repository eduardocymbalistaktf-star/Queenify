-- Paid Boost records must only be created after a trusted payment event.
DROP POLICY IF EXISTS "Users manage own boosts" ON public.boost_purchases;
DROP POLICY IF EXISTS "Users view own boosts" ON public.boost_purchases;

CREATE POLICY "Users view own boosts"
  ON public.boost_purchases
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

REVOKE INSERT, UPDATE, DELETE ON TABLE public.boost_purchases FROM anon, authenticated;
GRANT SELECT ON TABLE public.boost_purchases TO authenticated;
