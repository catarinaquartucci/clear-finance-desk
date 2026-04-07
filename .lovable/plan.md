

# Filtros Estilo Excel para Fornecedores

## O que será feito

Adicionar filtros por coluna no cabeçalho da tabela de fornecedores, similar ao filtro do Excel. Cada coluna terá um ícone de funil clicável que abre um popover com as opções únicas daquela coluna (checkboxes), permitindo selecionar múltiplos valores. Também será adicionada ordenação por coluna (clique no título para alternar asc/desc).

## Como funciona para o usuário

- Cada cabeçalho de coluna ganha um ícone de **funil** (Filter) ao lado do nome
- Ao clicar, abre um **popover** com:
  - Campo de busca para filtrar opções
  - Lista de checkboxes com todos os valores únicos daquela coluna
  - Botões "Selecionar Todos" e "Limpar"
- Clicar no **nome** da coluna ordena asc/desc (indicador visual com seta)
- Filtros ativos mostram o ícone de funil **preenchido/colorido**
- Badge no topo mostrando filtros ativos com botão "Limpar todos"
- Filtro de **Status** (Ativo/Inativo) como toggle rápido

## Mudanças técnicas

### Arquivo: `src/components/finance/cadastros/SuppliersList.tsx`

- Adicionar states: `sortColumn`, `sortDirection`, `columnFilters` (Record de coluna para Set de valores selecionados)
- Criar componente inline `ColumnFilterPopover` que recebe os valores únicos de uma coluna e renderiza popover com checkboxes
- Modificar `<TableHead>` para incluir botão de sort + botão de filtro
- Encadear a lógica de filtragem: busca textual global > filtros por coluna > ordenação
- Adicionar barra de filtros ativos acima da tabela com badges removíveis

### Colunas filtráveis
| Coluna | Tipo de filtro |
|---|---|
| Nome | Texto (busca global já existente) |
| Categoria | Multi-select (checkboxes) |
| Filial | Multi-select (checkboxes) |
| Status | Multi-select (Ativo/Inativo) |

### Colunas ordenáveis
Todas: Nome, CNPJ/CPF, Categoria, Filial, Email, Status

Nenhuma alteração de backend necessária.

