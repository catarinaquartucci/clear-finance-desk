-- Adicionar search_path às funções trigger para segurança
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_admin_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Adiciona role de admin para ambos emails da Camila
  IF NEW.email IN ('camila.adegas@viverdeia.ai', 'camila.adegas@gmail.com') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_data_prevista_reembolso()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.data_prevista_pagamento := calcular_data_prevista_reembolso(NEW.created_at);
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_data_prevista_devolucao()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.data_prevista_pagamento := calcular_data_prevista_devolucao(NEW.created_at);
  RETURN NEW;
END;
$function$;