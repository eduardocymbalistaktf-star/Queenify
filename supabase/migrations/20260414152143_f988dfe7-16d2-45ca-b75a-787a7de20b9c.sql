
CREATE OR REPLACE FUNCTION public.cancel_boost_on_chargeback()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Cancel any active boost for the user who received a chargeback
  UPDATE public.boost_purchases
  SET renewal_status = 'cancelled_chargeback',
      ends_at = now()
  WHERE user_id = NEW.user_id
    AND renewal_status = 'active'
    AND ends_at > now();
  
  -- Notify the user
  INSERT INTO public.notifications (user_id, title, message, type)
  VALUES (
    NEW.user_id,
    'Boost cancelado por chargeback',
    'Seu boost ativo foi cancelado automaticamente devido a um chargeback registrado. Entre em contato com o suporte para mais informações.',
    'warning'
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_cancel_boost_on_chargeback
  AFTER INSERT ON public.chargebacks
  FOR EACH ROW
  EXECUTE FUNCTION public.cancel_boost_on_chargeback();
