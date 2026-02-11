-- Remover políticas RLS
DROP POLICY IF EXISTS "Usuários podem criar contratos finder fee" ON contratos_finder_fee;
DROP POLICY IF EXISTS "Usuários podem ver seus próprios contratos finder fee" ON contratos_finder_fee;
DROP POLICY IF EXISTS "Admins podem atualizar contratos finder fee" ON contratos_finder_fee;
DROP POLICY IF EXISTS "Admins podem excluir contratos finder fee" ON contratos_finder_fee;

-- Remover tabela
DROP TABLE IF EXISTS contratos_finder_fee;