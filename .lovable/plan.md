

# Conciliação Bancária — Formato Agenda (Calendário por Dia)

## Referência
A imagem enviada mostra um sistema de tesouraria com calendário mensal onde se clica no dia para ver os movimentos daquele dia, com classificação financeira, histórico, valor e +/-.

## Proposta

Substituir a tabela flat por uma visualização de **agenda/calendário mensal** onde:
1. Um grid de calendário mostra todos os dias do mês selecionado
2. Cada dia mostra um indicador visual: quantidade de transações, total do dia, e se há pendentes
3. Ao clicar num dia, expande-se abaixo (ou ao lado) a lista de transações daquele dia
4. Indicador de **última conciliação**: badge no topo mostrando a data da última transação conciliada

### Layout

```text
┌─ Conta | Mês | Filtros | Botões ──────────────────┐
│                                                     │
│  Última conciliação: 06/03/2026                    │
│                                                     │
│  ┌──┬──┬──┬──┬──┬──┬──┐                           │
│  │Do│Se│Te│Qu│Qu│Se│Sá│  ← Cabeçalho dias         │
│  ├──┼──┼──┼──┼──┼──┼──┤                           │
│  │  │  │  │  │  │  │ 1│                           │
│  │ 2│ 3│ 4│ 5│[6]│7│ 8│  ← [6] = dia selecionado │
│  │  │  │  │  │3tx│  │  │  ← indicador transações  │
│  │  │  │  │  │●  │  │  │  ← ● = tem pendentes     │
│  └──┴──┴──┴──┴──┴──┴──┘                           │
│                                                     │
│  ═══ Movimentos de 06/03/2026 ═══                  │
│  Classificação  │ Histórico        │ Valor   │ +/- │
│  APORTE         │ PIX RECEBIDO...  │11.800   │  +  │
│  RENDIMENTOS    │ RENDIMENTO       │   0,01  │  +  │
│  DESP. FUNC.    │ DESP. FUNC...    │ 5.697   │  -  │
│  ...            │                  │         │     │
│                                                     │
│  Saldo Anterior: 111,66  │  Créditos: 11.800,01   │
│  Débitos: 11.853,46      │  Saldo Final: 58,21    │
└─────────────────────────────────────────────────────┘
```

### Alterações

**1. `src/components/finance/reconciliation/ReconciliationPanel.tsx`** — Reescrever
- Substituir a tabela por dois componentes: `ReconciliationCalendar` + `DayTransactionsList`
- State: `selectedDay: number | null`
- Agrupar transações por dia (`Map<string, BankTransaction[]>`)
- Calcular data da última conciliação (max `conciliated_at` das transações)
- Manter toolbar existente (conta, mês, filtros, importar, auto-conciliar)
- Manter stats cards existentes
- Adicionar badge "Última conciliação: dd/MM/yyyy"

**2. Criar `src/components/finance/reconciliation/ReconciliationCalendar.tsx`**
- Grid 7 colunas (Dom–Sáb) com os dias do mês
- Cada célula mostra: número do dia, contagem de transações, indicador de pendentes (ponto colorido)
- Dia selecionado destacado com bg-primary
- Dias com transações pendentes: borda amber; todos conciliados: borda emerald

**3. Criar `src/components/finance/reconciliation/DayTransactionsList.tsx`**
- Recebe transações do dia selecionado
- Tabela com: Classificação, Descrição/Histórico, Valor, +/-, Status, Ações (conciliar/ignorar/desfazer)
- Resumo do dia no rodapé: saldo anterior, créditos, débitos, saldo final
- Mantém todas as ações existentes (conciliar, ignorar, desfazer)

### Arquivos

| Arquivo | Ação |
|---------|------|
| `src/components/finance/reconciliation/ReconciliationPanel.tsx` | Reescrever — agenda + badge última conciliação |
| `src/components/finance/reconciliation/ReconciliationCalendar.tsx` | Criar — grid calendário mensal |
| `src/components/finance/reconciliation/DayTransactionsList.tsx` | Criar — lista de transações do dia |

Dialogs existentes (Import, Conciliate, Auto) permanecem inalterados.

