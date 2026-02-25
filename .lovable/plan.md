# Proposta de Modulos Financeiros Completos - Vantari

## Visao Geral

Transformar o Vantari em um sistema financeiro completo, substituindo totalmente o Marvee e adicionando funcionalidades que cobrem todo o ciclo financeiro de uma empresa. Os modulos existentes (Planejamento, Fluxo de Caixa, Analise Financeira, Impostos, Metas, Bonus, Distribuicao) serao mantidos e complementados.

---

## Novos Modulos Propostos

### 1. Cadastros Base (Fundacao do sistema)

**Rota:** `/financeiro/cadastros`

- **Fornecedores**: nome, CNPJ/CPF, contato, endereco, dados bancarios, categoria
- Filiais - nome, cnpj, endereço;
- Colaboradores: nome, CPF, contato; dados bancários
- **Clientes**: nome, CNPJ/CPF, contato, endereco, segmento
- **Contas Bancarias**: banco, agencia, conta, tipo, saldo inicial
- **Plano de Contas**: estrutura hierarquica de categorias financeiras (receitas, despesas, custos)
- **Centros de Custo**: departamentos/projetos para alocacao de despesas

Esses cadastros alimentam todos os demais modulos.

---

### 2. Contas a Pagar

**Rota:** `/financeiro/contas-pagar`

- Lancamento de titulos a pagar (fornecedor, valor, vencimento, categoria, centro de custo)
- Parcelamento automatico (gerar N parcelas)
- Anexo de comprovantes/boletos
- Baixa manual ou automatica (via conciliacao)
- Alertas de vencimento (hoje, proximos 7 dias, vencidos)
- Filtros por status (aberto, pago, vencido), periodo, fornecedor, categoria
- Dashboard com totais: a vencer hoje, semana, mes, vencidos

---

### 3. Contas a Receber

**Rota:** `/financeiro/contas-receber`

- Lancamento de titulos a receber (cliente, valor, vencimento, categoria)
- Geracao e envio de boletos (integracao futura com gateway)
- Parcelamento e recorrencias
- Baixa manual ou automatica
- Inadimplencia: titulos vencidos com destaque e aging report
- Filtros similares ao Contas a Pagar

---

### 4. Conciliacao Bancaria

**Rota:** `/financeiro/conciliacao`

- Importacao de extrato bancario (OFX/CSV)
- Listagem de movimentacoes do extrato lado a lado com lancamentos internos
- Match automatico (por valor + data +/- tolerancia)
- Match manual (arrastar/vincular)
- Itens nao conciliados destacados
- Saldo banco vs saldo sistema
- Historico de conciliacoes por conta/mes

---

### 5. Emissao de Notas Fiscais (NFS-e)

**Rota:** `/financeiro/emissao-nf`

- Cadastro de servicos prestados
- Emissao de NFS-e (integracao futura com prefeitura ou gateway como eNotas/NFE.io)
- Vinculacao com conta a receber
- Historico de notas emitidas
- Status: emitida, cancelada, substituida
- Exportacao em PDF

> Nota: A emissao real de NFS-e requer integracao com APIs de prefeitura ou intermediarios. Inicialmente, o modulo pode funcionar como controle interno, gerando PDFs de pre-nota, com campo para integracao futura.

---

### 6. Emissao de Boletos

**Rota:** `/financeiro/boletos`

- Geracao de boletos vinculados a contas a receber
- Integracao futura com gateway de pagamento (ex: Asaas, PagHiper, Inter)
- Acompanhamento de status: gerado, enviado, pago, vencido
- Envio por email ao cliente
- Baixa automatica via webhook do gateway

> Nota: Similar a NFS-e, inicialmente sera controle interno. A geracao real de boletos bancarios requer integracao com instituicao financeira.

---

### 7. Relatorios Financeiros

**Rota:** `/financeiro/relatorios`

- **DRE** (Demonstracao de Resultado): receitas - despesas - impostos = lucro
- **Balanco simplificado**: ativos vs passivos
- **Fluxo de Caixa realizado vs projetado** (complementa o modulo existente)
- **Aging Report**: titulos por faixa de vencimento (0-30, 31-60, 61-90, 90+ dias)
- **Relatorio por fornecedor/cliente**: quanto pagou/recebeu de cada
- **Relatorio por centro de custo**
- Exportacao em Excel e PDF

---

## Arquitetura de Dados (novas tabelas)

```text
suppliers (fornecedores)
  id, name, document (CNPJ/CPF), contact_email, contact_phone,
  address, bank_name, bank_agency, bank_account, pix_key, category, active

customers (clientes)
  id, name, document, contact_email, contact_phone, address, segment, active

bank_accounts (contas bancarias)
  id, name, bank_name, agency, account_number, account_type,
  initial_balance, current_balance, active

chart_of_accounts (plano de contas)
  id, code, name, type (revenue/expense/cost), parent_id, level, active

cost_centers (centros de custo)
  id, code, name, description, active

payables (contas a pagar)
  id, supplier_id, description, amount, due_date, paid_date,
  status (open/paid/overdue/cancelled), chart_account_id,
  cost_center_id, installment_number, installment_total,
  payment_method, notes, attachments

receivables (contas a receber)
  id, customer_id, description, amount, due_date, received_date,
  status (open/received/overdue/cancelled), chart_account_id,
  invoice_id, boleto_id, installment_number, installment_total, notes

bank_transactions (extrato bancario)
  id, bank_account_id, date, description, amount, type (credit/debit),
  balance, reference, conciliated, conciliated_with_id, conciliated_at

invoices (notas fiscais emitidas)
  id, customer_id, service_description, amount, tax_amount,
  status (draft/issued/cancelled), issued_at, invoice_number, pdf_url

boletos
  id, receivable_id, customer_id, amount, due_date,
  status (generated/sent/paid/overdue/cancelled), barcode, pdf_url
```

---

## Ordem de Implementacao Sugerida


| Fase | Modulo                 | Motivo                                |
| ---- | ---------------------- | ------------------------------------- |
| 1    | Cadastros Base         | Fundacao para todos os outros modulos |
| 2    | Contas a Pagar         | Alta prioridade operacional           |
| 3    | Contas a Receber       | Complementa o ciclo financeiro        |
| 4    | Conciliacao Bancaria   | Controle e auditoria                  |
| 5    | Relatorios Financeiros | Visao consolidada                     |
| 6    | Emissao de NFS-e       | Requer integracao externa             |
| 7    | Emissao de Boletos     | Requer integracao externa             |


---

## Navegacao

A aba "Financeiro" ganhara sub-navegacao expandida, agrupando os modulos:

- **Operacional**: Contas a Pagar, Contas a Receber, Conciliacao
- **Cadastros**: Fornecedores, Clientes, Contas Bancarias, Plano de Contas
- **Emissao**: Notas Fiscais, Boletos
- **Analise**: Planejamento, Fluxo de Caixa, Analise Financeira, Relatorios, Metas, Bonus, Distribuicao, Impostos

---

## Detalhes Tecnicos

- Todas as tabelas com RLS baseado em roles `admin`, `finance`, `finance_viewer`
- Reutilizar padroes existentes do projeto (hooks com react-query, componentes shadcn/ui)
- Importacao de extratos via parsing de OFX/CSV no frontend
- Integracao com gateways de pagamento e NFS-e como fase futura (secrets configurados sob demanda)
- Modulos de Marvee serao gradualmente desativados conforme os novos assumem