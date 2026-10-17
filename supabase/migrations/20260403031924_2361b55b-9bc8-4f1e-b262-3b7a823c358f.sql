-- Allow public read of profiles for public profile pages
CREATE POLICY "Profiles are publicly viewable"
ON public.profiles FOR SELECT
USING (true);

-- Drop the old restrictive select policy
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Allow public read of active products for public profile pages
CREATE POLICY "Active products are publicly viewable"
ON public.products FOR SELECT
USING (is_active = true);

-- Drop old restrictive select policy
DROP POLICY IF EXISTS "Users can view own products" ON public.products;