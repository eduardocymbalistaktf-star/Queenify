-- Fix user_settings: remove overly permissive SELECT policy
DROP POLICY IF EXISTS "User settings are publicly viewable" ON public.user_settings;

-- Only owner can view their own settings
CREATE POLICY "Users can view own settings"
ON public.user_settings
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create a secure function for public profile data (non-sensitive fields only)
CREATE OR REPLACE FUNCTION public.get_public_profile_settings(_user_id uuid)
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'theme', theme,
    'accent_color', accent_color,
    'show_level', show_level,
    'show_frame', show_frame,
    'bio', bio,
    'social_instagram', social_instagram,
    'social_youtube', social_youtube,
    'social_tiktok', social_tiktok
  )
  FROM public.user_settings
  WHERE user_id = _user_id
  LIMIT 1;
$$;