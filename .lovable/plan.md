

# Relatórios Financeiros — Redesign Visual

## Problema atual
Os relatórios são tabelas brutas com filtros simples no topo. Falta hierarquia visual, cards de resumo, e a estética geral é genérica.

## Proposta

Transformar cada aba de relatório em um layout mais rico e profissional:

### 1. Resumo Executivo — Melhorar cards
- Cards com gradiente sutil no ícone, sombra hover animada, e borda colorida lateral indicando tipo (verde=positivo, vermelho=negativo, amarelo=alerta)
- Adicionar sparkline ou mini progress bar nos cards de inadimplência e ticket médio
- KPIs em grid responsivo com animação de entrada (fade-in)

### 2. Relatórios de tabela (Pagar, Receber, Pagas) — Layout com summary cards + tabela estilizada
- **Faixa de resumo no topo**: 3-4 mini cards antes da tabela mostrando Total, Quantidade, Maior Valor, Valor Médio — com ícones e cores
- **Tabela dentro de Card**: envolver em `Card` com `CardHeader` contendo título e contagem
- **Linha de total na tabela**: `TableFooter` com background destacado e fonte bold
- **Status badges traduzidos**: "overdue" → "Vencido", "pending" → "Pendente", "paid" → "Pago" com cores distintas
- **Hover suave** nas linhas com transição
- **Valores negativos/positivos** com cor contextual

### 3. Filtros (ReportFilters) — Redesign
- Envolver em um Card com background sutil (`bg-muted/30`)
- Ícone de filtro no início
- Botões de export com ícones maiores e tooltip
- Separador visual entre filtros e botões de exportação

### 4. Centros de Custo — Manter gráfico, melhorar tabela
- Adicionar barra de progresso colorida na coluna "Total" proporcional ao maior valor
- Destaque visual na linha com maior gasto

### 5. Fluxo Mensal — Melhorar visual do gráfico
- Adicionar cards de resumo acima: Total Receitas, Total Despesas, Saldo Acumulado
- Estilizar tooltip do gráfico com formatação brasileira

### 6. Estado vazio e loading
- Loading com skeleton animado em vez de texto "Carregando..."
- Estado vazio com ilustração/ícone grande e texto convidativo

## Arquivos a editar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/finance/reports/ReportFilters.tsx` | Redesign — card com ícone, separador, tooltips |
| `src/components/finance/reports/ExecutiveSummary.tsx` | Cards com borda lateral colorida, hover animado, fade-in |
| `src/components/finance/reports/PayablesReport.tsx` | Summary cards no topo, tabela em Card, footer com total, status traduzido, skeletons |
| `src/components/finance/reports/ReceivablesReport.tsx` | Mesmas melhorias do PayablesReport |
| `src/components/finance/reports/PaidReport.tsx` | Mesmas melhorias |
| `src/components/finance/reports/CostCenterDashboard.tsx` | Barra de progresso na tabela, destaque maior gasto |
| `src/components/finance/reports/MonthlyFlowChart.tsx` | Cards resumo acima do gráfico, tooltip estilizado |
| `src/pages/financeiro/Relatorios.tsx` | Tabs estilizadas com ícones em cada aba |

