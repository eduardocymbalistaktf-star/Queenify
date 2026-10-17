-- A browser may submit a review, but cannot publish it or mark it verified.
ALTER TABLE public.product_reviews
  ALTER COLUMN is_approved SET DEFAULT false,
  ALTER COLUMN is_verified_purchase SET DEFAULT false;

DROP POLICY IF EXISTS "Users can create reviews" ON public.product_reviews;
CREATE POLICY "Users can submit pending reviews"
  ON public.product_reviews FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = reviewer_id
    AND is_approved = false
    AND is_verified_purchase = false
    AND (comment IS NULL OR char_length(comment) <= 3000)
  );

DROP POLICY IF EXISTS "Users can update own reviews" ON public.product_reviews;
CREATE POLICY "Users can update own pending reviews"
  ON public.product_reviews FOR UPDATE TO authenticated
  USING (auth.uid() = reviewer_id AND is_approved = false)
  WITH CHECK (
    auth.uid() = reviewer_id
    AND is_approved = false
    AND is_verified_purchase = false
    AND (comment IS NULL OR char_length(comment) <= 3000)
  );

CREATE POLICY "Moderators can view pending reviews"
  ON public.product_reviews FOR SELECT TO authenticated
  USING (
    is_approved = false
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderador'))
  );

CREATE POLICY "Moderators can approve reviews"
  ON public.product_reviews FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderador'))
  WITH CHECK (
    is_verified_purchase = false
    AND (comment IS NULL OR char_length(comment) <= 3000)
  );

CREATE POLICY "Moderators can reject pending reviews"
  ON public.product_reviews FOR DELETE TO authenticated
  USING (
    is_approved = false
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderador'))
  );
