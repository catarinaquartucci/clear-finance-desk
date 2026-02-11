-- Criar tabela de notificações
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL,
  action TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  reference_id UUID,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- Habilitar RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view own notifications" 
  ON public.notifications FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" 
  ON public.notifications FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- Habilitar Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Função para criar notificação
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_action TEXT,
  p_title TEXT,
  p_message TEXT,
  p_reference_id UUID DEFAULT NULL
) RETURNS VOID 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO notifications (user_id, type, action, title, message, reference_id)
  VALUES (p_user_id, p_type, p_action, p_title, p_message, p_reference_id);
END;
$$;

-- Trigger para reembolsos
CREATE OR REPLACE FUNCTION public.notify_reembolso_change()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM create_notification(
      NEW.user_id,
      'reembolso',
      CASE 
        WHEN NEW.status = 'aprovado' THEN 'approved'
        WHEN NEW.status = 'rejeitado' THEN 'rejected'
        WHEN NEW.status = 'pago' THEN 'paid'
        ELSE 'updated'
      END,
      CASE 
        WHEN NEW.status = 'aprovado' THEN 'Reembolso Aprovado'
        WHEN NEW.status = 'rejeitado' THEN 'Reembolso Rejeitado'
        WHEN NEW.status = 'pago' THEN 'Reembolso Pago'
        ELSE 'Reembolso Atualizado'
      END,
      'Seu reembolso de R$ ' || NEW.valor || ' foi ' || NEW.status,
      NEW.id
    );
  END IF;
  
  IF TG_OP = 'INSERT' THEN
    INSERT INTO notifications (user_id, type, action, title, message, reference_id)
    SELECT c.user_id, 'reembolso', 'created', 'Novo Reembolso', 
           'Nova solicitação de reembolso de ' || NEW.nome || ' - R$ ' || NEW.valor,
           NEW.id
    FROM colaboradores c WHERE c.is_admin = true AND c.user_id IS NOT NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER reembolso_notification_trigger
  AFTER INSERT OR UPDATE ON public.reembolsos
  FOR EACH ROW EXECUTE FUNCTION public.notify_reembolso_change();

-- Trigger para devoluções
CREATE OR REPLACE FUNCTION public.notify_devolucao_change()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM create_notification(
      NEW.user_id,
      'devolucao',
      CASE 
        WHEN NEW.status = 'aprovado' THEN 'approved'
        WHEN NEW.status = 'rejeitado' THEN 'rejected'
        WHEN NEW.status = 'pago' THEN 'paid'
        ELSE 'updated'
      END,
      CASE 
        WHEN NEW.status = 'aprovado' THEN 'Devolução Aprovada'
        WHEN NEW.status = 'rejeitado' THEN 'Devolução Rejeitada'
        WHEN NEW.status = 'pago' THEN 'Devolução Paga'
        ELSE 'Devolução Atualizada'
      END,
      'Sua devolução de R$ ' || NEW.valor || ' foi ' || NEW.status,
      NEW.id
    );
  END IF;
  
  IF TG_OP = 'INSERT' THEN
    INSERT INTO notifications (user_id, type, action, title, message, reference_id)
    SELECT c.user_id, 'devolucao', 'created', 'Nova Devolução', 
           'Nova solicitação de devolução de ' || NEW.nome_cliente || ' - R$ ' || NEW.valor,
           NEW.id
    FROM colaboradores c WHERE c.is_admin = true AND c.user_id IS NOT NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER devolucao_notification_trigger
  AFTER INSERT OR UPDATE ON public.devolucoes
  FOR EACH ROW EXECUTE FUNCTION public.notify_devolucao_change();

-- Trigger para materiais
CREATE OR REPLACE FUNCTION public.notify_material_change()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM create_notification(
      NEW.user_id,
      'material',
      CASE 
        WHEN NEW.status = 'aprovado' THEN 'approved'
        WHEN NEW.status = 'rejeitado' THEN 'rejected'
        ELSE 'updated'
      END,
      CASE 
        WHEN NEW.status = 'aprovado' THEN 'Material Aprovado'
        WHEN NEW.status = 'rejeitado' THEN 'Material Rejeitado'
        ELSE 'Material Atualizado'
      END,
      'Sua solicitação de material "' || NEW.material || '" foi ' || NEW.status,
      NEW.id
    );
  END IF;
  
  IF TG_OP = 'INSERT' THEN
    INSERT INTO notifications (user_id, type, action, title, message, reference_id)
    SELECT c.user_id, 'material', 'created', 'Novo Material', 
           'Nova solicitação de material de ' || NEW.nome_solicitante || ' - ' || NEW.material,
           NEW.id
    FROM colaboradores c WHERE c.is_admin = true AND c.user_id IS NOT NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER material_notification_trigger
  AFTER INSERT OR UPDATE ON public.materiais
  FOR EACH ROW EXECUTE FUNCTION public.notify_material_change();

-- Trigger para notas fiscais
CREATE OR REPLACE FUNCTION public.notify_nota_fiscal_change()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM create_notification(
      NEW.user_id,
      'nota_fiscal',
      CASE 
        WHEN NEW.status = 'aprovado' THEN 'approved'
        WHEN NEW.status = 'rejeitado' THEN 'rejected'
        WHEN NEW.status = 'pago' THEN 'paid'
        ELSE 'updated'
      END,
      CASE 
        WHEN NEW.status = 'aprovado' THEN 'Nota Fiscal Aprovada'
        WHEN NEW.status = 'rejeitado' THEN 'Nota Fiscal Rejeitada'
        WHEN NEW.status = 'pago' THEN 'Nota Fiscal Paga'
        ELSE 'Nota Fiscal Atualizada'
      END,
      'Sua nota fiscal de R$ ' || NEW.valor || ' foi ' || NEW.status,
      NEW.id
    );
  END IF;
  
  IF TG_OP = 'INSERT' THEN
    INSERT INTO notifications (user_id, type, action, title, message, reference_id)
    SELECT c.user_id, 'nota_fiscal', 'created', 'Nova Nota Fiscal', 
           'Nova nota fiscal de ' || NEW.nome || ' - R$ ' || NEW.valor,
           NEW.id
    FROM colaboradores c WHERE c.is_admin = true AND c.user_id IS NOT NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER nota_fiscal_notification_trigger
  AFTER INSERT OR UPDATE ON public.notas_fiscais
  FOR EACH ROW EXECUTE FUNCTION public.notify_nota_fiscal_change();