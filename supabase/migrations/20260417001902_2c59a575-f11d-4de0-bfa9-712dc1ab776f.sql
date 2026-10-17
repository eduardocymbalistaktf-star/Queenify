DROP POLICY IF EXISTS "System inserts tracking events" ON public.tracking_events;
CREATE POLICY "Users insert own tracking events" ON public.tracking_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);