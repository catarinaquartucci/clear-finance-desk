

# Análise de UX e Melhorias Propostas

## Problemas Identificados

### 1. Estado Vazio na Conciliação
A tela de conciliação abre com "Selecione uma conta bancária" — um beco sem saída visual. O usuário não sabe o que fazer e o espaço fica desperdiçado. A conta deveria ser auto-selecionada quando só há uma ativa.

### 2. Calendário Ilegível no Mobile
O calendário de 7 colunas com células de 80px de altura fica comprimido demais em telas menores que 768px. Os valores monetários ficam cortados e os indicadores de status ficam invisíveis.

### 3. Falta de Feedback de Progresso na Conciliação
Não há barra de progresso visual mostrando "X de Y transações conciliadas". O usuário precisa fazer conta mental olhando os cards de stats.

### 4. Toolbar Desorganizada
Na conciliação, os filtros (empresa, conta, mês) e ações (importar, conciliar auto) estão todos na mesma linha, competindo por espaço. Em telas médias, os botões quebram para baixo de forma desalinhada.

### 5. Navegação por Meses Pouco Fluida
O seletor de mês é um dropdown com 12 opções. Não tem setas para avançar/retroceder mês rapidamente — o fluxo mais comum do usuário.

### 6. Dashboard sem Ação Direta
Os KPI cards do dashboard mostram R$ 0,00 mas não oferecem um caminho claro para o usuário popular os dados (importar extrato, cadastrar transação). Falta onboarding.

### 7. Legenda do Gráfico de Pizza Poluída
A legenda do gráfico "Despesas por Tipo" no dashboard tem 15+ itens em texto pequeno, sobrepondo-se visualmente. Deveria limitar a 6-8 e agrupar o resto em "Outros".

### 8. Falta de Atalhos de Teclado
Nenhuma ação crítica tem atalho de teclado. Ex: `Ctrl+I` para importar, `←/→` para navegar meses, `Esc` para fechar dia selecionado.

---

## Plano de Melhorias

### Melhoria 1 — Auto-seleção de Conta + Empty State Guiado
**Arquivo:** `ReconciliationPanel.tsx`
- Auto-selecionar primeira conta ativa quando nenhuma está selecionada
- Substituir mensagem genérica por empty state com ícone, texto explicativo e botão "Importar Primeiro Extrato"

### Melhoria 2 — Barra de Progresso de Conciliação
**Arquivo:** `ReconciliationPanel.tsx`
- Adicionar `Progress` bar entre stats e calendário mostrando % conciliado
- Formato: barra verde com texto "67% conciliado (45 de 67)"

### Melhoria 3 — Navegação de Mês com Setas
**Arquivo:** `ReconciliationPanel.tsx`
- Substituir dropdown de mês por componente com setas `←` mês `→`
- Manter dropdown como fallback ao clicar no nome do mês

### Melhoria 4 — Calendário Responsivo
**Arquivo:** `ReconciliationCalendar.tsx`
- Em telas < 640px, alternar para uma lista diária (accordion) ao invés do grid 7x5
- Mostrar apenas dias com movimentação, com resumo de créditos/débitos

### Melhoria 5 — Legenda do Gráfico Limitada
**Arquivo:** `ExpenseBreakdownPie.tsx`
- Limitar a 7 categorias no gráfico e agrupar restante em "Outros"
- Mostrar tooltip com breakdown completo ao clicar em "Outros"

### Melhoria 6 — Toolbar Reorganizada
**Arquivo:** `ReconciliationPanel.tsx`
- Separar visualmente filtros (linha 1) de ações (linha 2) com um `Separator`
- Alinhar ações à direita com espaçamento consistente

### Melhoria 7 — Empty State do Dashboard com Onboarding
**Arquivo:** `Index.tsx`
- Quando todos KPIs = 0, mostrar card de onboarding com 3 passos: "1. Cadastre uma conta → 2. Importe um extrato → 3. Concilie"
- Links diretos para cada etapa

---

## Detalhes Técnicos

| Arquivo | Tipo de Mudança |
|---|---|
| `ReconciliationPanel.tsx` | useEffect auto-select + Progress bar + setas de mês + toolbar reorganizada |
| `ReconciliationCalendar.tsx` | Media query para modo lista em mobile |
| `ExpenseBreakdownPie.tsx` | Limitar categorias + agrupar "Outros" |
| `Index.tsx` | Empty state com onboarding guiado |

Nenhuma alteração de backend necessária. Todas as mudanças são puramente front-end.

