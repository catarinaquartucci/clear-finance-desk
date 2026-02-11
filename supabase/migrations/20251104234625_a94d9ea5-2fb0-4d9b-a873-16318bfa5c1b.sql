-- Atualizar trigger para aceitar ambos os emails como admin
CREATE OR REPLACE FUNCTION public.handle_admin_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Adiciona role de admin para ambos emails da Camila
  IF NEW.email IN ('camila.adegas@viverdeia.ai', 'camila.adegas@gmail.com') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Adicionar role de admin para a conta @gmail.com existente
INSERT INTO public.user_roles (user_id, role)
VALUES ('a7a9e9e1-5029-45cd-ac2c-03104a05c288', 'admin'::app_role)
ON CONFLICT (user_id, role) DO NOTHING;