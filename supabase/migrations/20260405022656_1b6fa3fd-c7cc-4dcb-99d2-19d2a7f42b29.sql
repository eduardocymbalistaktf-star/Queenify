
CREATE TABLE public.page_views (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  path text NOT NULL,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  owner_id uuid,
  visitor_id text NOT NULL DEFAULT gen_random_uuid()::text,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_page_views_owner ON public.page_views(owner_id);
CREATE INDEX idx_page_views_product ON public.page_views(product_id);
CREATE INDEX idx_page_views_created ON public.page_views(created_at);

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- Anyone can insert page views (tracking pixel)
CREATE POLICY "Anyone can insert page views"
ON public.page_views
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Owners can view their own page views
CREATE POLICY "Owners view own page views"
ON public.page_views
FOR SELECT
TO authenticated
USING (owner_id = auth.uid());
