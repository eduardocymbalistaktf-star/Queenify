
-- Table for collaboration invites
CREATE TABLE public.collaboration_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inviter_id UUID NOT NULL,
  invitee_email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'co-produtor',
  status TEXT NOT NULL DEFAULT 'pendente',
  invite_token TEXT NOT NULL DEFAULT encode(extensions.gen_random_bytes(32), 'hex'),
  share_percentage NUMERIC DEFAULT 0,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(invite_token)
);

ALTER TABLE public.collaboration_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Inviters manage own invites"
ON public.collaboration_invites
FOR ALL
USING (auth.uid() = inviter_id)
WITH CHECK (auth.uid() = inviter_id);

CREATE POLICY "Invitees can view their invites"
ON public.collaboration_invites
FOR SELECT
USING (invitee_email IN (
  SELECT email FROM auth.users WHERE id = auth.uid()
));

CREATE POLICY "Invitees can update their invites"
ON public.collaboration_invites
FOR UPDATE
USING (invitee_email IN (
  SELECT email FROM auth.users WHERE id = auth.uid()
));

-- Validation trigger: max 4 sócios per inviter
CREATE OR REPLACE FUNCTION public.check_max_socios()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'socio' AND NEW.status = 'aceito' THEN
    IF (SELECT COUNT(*) FROM public.collaboration_invites 
        WHERE inviter_id = NEW.inviter_id AND role = 'socio' AND status = 'aceito' AND id != NEW.id) >= 4 THEN
      RAISE EXCEPTION 'Limite máximo de 4 sócios atingido';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_max_socios
BEFORE INSERT OR UPDATE ON public.collaboration_invites
FOR EACH ROW EXECUTE FUNCTION public.check_max_socios();
