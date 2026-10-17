-- Allow public read of user_settings for public profile pages (social links)
CREATE POLICY "User settings are publicly viewable"
ON public.user_settings FOR SELECT
USING (true);

-- Drop old restrictive select policy
DROP POLICY IF EXISTS "Users can view own settings" ON public.user_settings;