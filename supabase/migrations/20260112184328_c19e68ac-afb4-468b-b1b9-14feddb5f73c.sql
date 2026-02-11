-- Create automation_config table
CREATE TABLE public.automation_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  job_name TEXT NOT NULL UNIQUE,
  schedule TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  function_name TEXT NOT NULL,
  config JSONB DEFAULT '{}'::jsonb,
  last_run TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.automation_config ENABLE ROW LEVEL SECURITY;

-- Only admins can view automations
CREATE POLICY "Admins can view automations"
ON public.automation_config
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Only admins can update automations
CREATE POLICY "Admins can update automations"
ON public.automation_config
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Only admins can insert automations
CREATE POLICY "Admins can insert automations"
ON public.automation_config
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Only admins can delete automations
CREATE POLICY "Admins can delete automations"
ON public.automation_config
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_automation_config_updated_at
BEFORE UPDATE ON public.automation_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert existing automations (paused by default)
INSERT INTO public.automation_config (name, description, job_name, schedule, is_active, function_name, config)
VALUES 
  ('Relatório Financeiro Diário', 'Envia resumo financeiro do dia para o Discord automaticamente', 'daily-financial-report', '30 15 * * *', false, 'discord-daily-report', '{"webhooks": ["primary", "secondary"]}'::jsonb);