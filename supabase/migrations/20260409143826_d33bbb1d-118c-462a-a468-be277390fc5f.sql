
CREATE TABLE public.user_pixels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  pixel_id text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.user_pixels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own pixels" ON public.user_pixels
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.generate_pixel_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_pixel text;
BEGIN
  LOOP
    new_pixel := lpad(floor(random() * 999999999999)::bigint::text, 12, '0');
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.user_pixels WHERE pixel_id = new_pixel);
  END LOOP;
  NEW.pixel_id := new_pixel;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_pixel_id
  BEFORE INSERT ON public.user_pixels
  FOR EACH ROW
  WHEN (NEW.pixel_id IS NULL OR NEW.pixel_id = '')
  EXECUTE FUNCTION public.generate_pixel_id();
