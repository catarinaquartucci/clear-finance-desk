

# Adicionar Edicao de Usuarios na aba "Usuarios do Sistema"

## O que sera feito

Adicionar um botao "Editar" em cada card de usuario na tela de Configuracoes > Usuarios, que abre um dialog com os campos editaveis do colaborador (nome, email, funcao, area, status ativo). Os toggles de permissao ja existem inline e continuam funcionando como estao.

## Mudancas

### Arquivo: `src/components/admin/configuracoes/UsuariosSistema.tsx`

1. Adicionar estado para controlar o dialog de edicao (`editingUser`) e os campos do formulario
2. Adicionar botao "Editar" (icone `Pencil`) em cada card de usuario, ao lado das informacoes
3. Criar um `Dialog` com formulario inline contendo os campos:
   - Nome
   - Email (somente leitura se ja tem `user_id` vinculado)
   - Funcao
   - Area
   - Status Ativo (switch)
4. Criar mutation para salvar as alteracoes na tabela `colaboradores`
5. Adicionar imports necessarios: `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `Button`, `Pencil` icon

### Comportamento

- Clicar no botao "Editar" abre o dialog preenchido com os dados atuais do colaborador
- Ao salvar, atualiza os campos na tabela `colaboradores` e invalida o cache
- Toast de confirmacao apos salvar com sucesso
- Os toggles de permissao (Admin, Financeiro, Viewer) continuam funcionando inline no card, sem mudanca

### Nenhuma mudanca no banco de dados

Todos os campos ja existem na tabela `colaboradores`. A mutation usa o mesmo padrao do `updateRole` ja existente.

