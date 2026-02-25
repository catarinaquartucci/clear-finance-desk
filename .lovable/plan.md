
# Importar Historico de Transacoes dos PDFs

## Resumo
Importar os dados extraidos dos dois PDFs para as tabelas `payables` (contas a pagar) e `receivables` (contas a receber), vinculando aos fornecedores e clientes ja cadastrados.

## Dados Identificados

### Contas a Receber (6 registros)
Do arquivo `contas_a_receber.pdf` - Filial Credifacil:
- Andre Oliveira: 2 lancamentos (R$ 203.680,20 e R$ 388.627,53)
- Lurdelene Oliveira: 1 lancamento (R$ 35.865,77)
- Marcos Roberto: 2 lancamentos (R$ 15.280,00 e R$ 27.362,66)
- Rafael Santos: 1 lancamento (R$ 40.760,62)
- Total: R$ 711.576,78

### Contas a Pagar (estimativa: ~500+ registros das 50 paginas processadas)
Do arquivo `relatoriosAction_contas_pagas.pdf` - periodo de Mar/2024 a Mar/2026. Categorias incluem:
- Cessao de Credito, Reembolso, Pro Labore, Marketing, Telefonia, Aluguel, Contabilidade, Sistema de Gestao, Bonus, Elaboracao de Calculos, entre outros.

## Plano de Execucao

### Etapa 1 - Inserir Contas a Receber
Inserir os 6 registros na tabela `receivables` com:
- `description`: historico do lancamento
- `amount`: valor bruto
- `due_date`: data de vencimento
- `received_date`: data de recebimento (quando houver)
- `status`: "received" (quando tem data de recebimento) ou "open" (quando nao tem)
- `customer_id`: vincular ao cliente correspondente na tabela `customers` (buscar por nome)

### Etapa 2 - Inserir Contas a Pagar
Processar todos os registros das 50 paginas e inserir na tabela `payables` com:
- `description`: historico do lancamento
- `amount`: valor bruto
- `due_date`: data de vencimento
- `paid_date`: data de baixa (quando Status = "B")
- `status`: "paid" (quando tem data de baixa) ou "open" (quando Status = "P")
- `supplier_id`: vincular ao fornecedor correspondente na tabela `suppliers` (buscar por nome)
- `notes`: tipo de despesa como referencia adicional

### Etapa 3 - Fornecedores/Clientes Faltantes
Alguns favorecidos/clientes podem nao existir ainda na base. Nesses casos:
- Criar automaticamente o fornecedor/cliente na tabela correspondente
- Vincular o registro ao novo cadastro

## Detalhes Tecnicos

- Os dados serao inseridos via ferramenta de insercao direta no banco
- As datas serao convertidas do formato DD/MM/YYYY para YYYY-MM-DD
- Valores serao convertidos do formato brasileiro (1.000,00) para numerico (1000.00)
- Registros com Status "B" (Baixado) serao marcados como pagos/recebidos
- Registros com Status "P" (Previsto) serao marcados como em aberto
- As 26 paginas restantes do PDF de contas a pagar serao processadas em etapa futura
