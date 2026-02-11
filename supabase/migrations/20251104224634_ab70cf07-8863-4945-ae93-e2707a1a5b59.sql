-- Renomear coluna numero_nota para link_venda_hubla na tabela devolucoes
ALTER TABLE devolucoes 
RENAME COLUMN numero_nota TO link_venda_hubla;

-- Adicionar comentário para documentação
COMMENT ON COLUMN devolucoes.link_venda_hubla IS 'Link da venda na plataforma Hubla (go.hubla.com)';