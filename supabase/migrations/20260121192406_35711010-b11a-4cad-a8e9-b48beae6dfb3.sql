-- Create table for director bonus configurations
CREATE TABLE public.director_bonus_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  director_id TEXT NOT NULL,
  year INTEGER NOT NULL,
  quarterly_base NUMERIC NOT NULL,
  annual_base NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(director_id, year)
);

-- Enable RLS
ALTER TABLE public.director_bonus_config ENABLE ROW LEVEL SECURITY;

-- Create policies for finance users
CREATE POLICY "Finance users can view director_bonus_config"
ON public.director_bonus_config
FOR SELECT
USING (public.has_role(auth.uid(), 'finance'));

CREATE POLICY "Finance users can insert director_bonus_config"
ON public.director_bonus_config
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'finance'));

CREATE POLICY "Finance users can update director_bonus_config"
ON public.director_bonus_config
FOR UPDATE
USING (public.has_role(auth.uid(), 'finance'));

CREATE POLICY "Finance users can delete director_bonus_config"
ON public.director_bonus_config
FOR DELETE
USING (public.has_role(auth.uid(), 'finance'));

-- Add trigger for updated_at
CREATE TRIGGER update_director_bonus_config_updated_at
BEFORE UPDATE ON public.director_bonus_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();