
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderador', 'produtor', 'afiliado');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  granted_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Role permissions table for granular control
CREATE TABLE public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role app_role NOT NULL,
  permission TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (role, permission)
);

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view permissions"
  ON public.role_permissions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins manage permissions"
  ON public.role_permissions FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Function to check if user has a specific permission
CREATE OR REPLACE FUNCTION public.has_permission(_user_id UUID, _permission TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role = rp.role
    WHERE ur.user_id = _user_id
      AND rp.permission = _permission
      AND rp.enabled = true
  )
$$;

-- Seed default permissions for each role
INSERT INTO public.role_permissions (role, permission, enabled) VALUES
  -- Admin: tudo
  ('admin', 'gerenciar_produtos', true),
  ('admin', 'gerenciar_usuarios', true),
  ('admin', 'gerenciar_financeiro', true),
  ('admin', 'gerenciar_anuncios', true),
  ('admin', 'moderar_conteudo', true),
  ('admin', 'gerenciar_afiliados', true),
  ('admin', 'ver_relatorios', true),
  ('admin', 'gerenciar_cupons', true),
  ('admin', 'gerenciar_webhooks', true),
  ('admin', 'gerenciar_checkout', true),
  ('admin', 'gerenciar_cursos', true),
  ('admin', 'gerenciar_roles', true),
  -- Moderador
  ('moderador', 'gerenciar_produtos', false),
  ('moderador', 'gerenciar_usuarios', false),
  ('moderador', 'gerenciar_financeiro', false),
  ('moderador', 'gerenciar_anuncios', false),
  ('moderador', 'moderar_conteudo', true),
  ('moderador', 'gerenciar_afiliados', false),
  ('moderador', 'ver_relatorios', true),
  ('moderador', 'gerenciar_cupons', false),
  ('moderador', 'gerenciar_webhooks', false),
  ('moderador', 'gerenciar_checkout', false),
  ('moderador', 'gerenciar_cursos', false),
  ('moderador', 'gerenciar_roles', false),
  -- Produtor
  ('produtor', 'gerenciar_produtos', true),
  ('produtor', 'gerenciar_usuarios', false),
  ('produtor', 'gerenciar_financeiro', false),
  ('produtor', 'gerenciar_anuncios', true),
  ('produtor', 'moderar_conteudo', false),
  ('produtor', 'gerenciar_afiliados', true),
  ('produtor', 'ver_relatorios', true),
  ('produtor', 'gerenciar_cupons', true),
  ('produtor', 'gerenciar_webhooks', true),
  ('produtor', 'gerenciar_checkout', true),
  ('produtor', 'gerenciar_cursos', true),
  ('produtor', 'gerenciar_roles', false),
  -- Afiliado
  ('afiliado', 'gerenciar_produtos', false),
  ('afiliado', 'gerenciar_usuarios', false),
  ('afiliado', 'gerenciar_financeiro', false),
  ('afiliado', 'gerenciar_anuncios', false),
  ('afiliado', 'moderar_conteudo', false),
  ('afiliado', 'gerenciar_afiliados', false),
  ('afiliado', 'ver_relatorios', true),
  ('afiliado', 'gerenciar_cupons', false),
  ('afiliado', 'gerenciar_webhooks', false),
  ('afiliado', 'gerenciar_checkout', false),
  ('afiliado', 'gerenciar_cursos', false),
  ('afiliado', 'gerenciar_roles', false);

-- Auto-assign 'produtor' role to new users
CREATE OR REPLACE FUNCTION public.assign_default_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'produtor')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_assign_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_default_role();
