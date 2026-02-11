
-- Primeira migração: Adicionar 'finance' ao enum app_role
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'finance';
