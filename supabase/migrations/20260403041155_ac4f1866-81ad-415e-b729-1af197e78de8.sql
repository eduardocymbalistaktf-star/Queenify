-- Allow public checkout to insert sales (buyers are not authenticated)
CREATE POLICY "Anyone can create sales via checkout"
ON public.sales
FOR INSERT
TO anon
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.products
    WHERE id = product_id AND is_active = true
  )
);

-- Allow anonymous users to read products for checkout
CREATE POLICY "Anyone can view active products"
ON public.products
FOR SELECT
TO anon
USING (is_active = true);
