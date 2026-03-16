

# Estilizar Exportacao PDF — Cabecalhos coloridos, logo e formatacao visual

## Situacao atual

A funcao `exportToPDF` em `src/lib/exportUtils.ts` gera um HTML minimalista com tabela basica, sem logo, sem cores de marca, e sem hierarquia visual. E chamada por 6 componentes de relatorio.

## Proposta

Reescrever `exportToPDF` para gerar um PDF profissional com:

### Layout do PDF

```text
+------------------------------------------+
| [Logo Vantari]     TITULO DO RELATORIO   |
|              Gerado em: dd/mm/yyyy hh:mm |
|------------------------------------------|
| Cards resumo (opcional):                 |
| Total: R$ X  |  Qtd: N  |  Media: R$ Y |
|------------------------------------------|
| TH  | TH  | TH  | TH  | TH            |
|-----|-----|-----|-----|------------------|
| td  | td  | td  | td  | td             |
| td  | td  | td  | td  | td             |
|-----|-----|-----|-----|------------------|
| TOTAL           | R$ X |                |
+------------------------------------------+
|         Vantari - Confidencial           |
+------------------------------------------+
```

### Melhorias visuais

- **Cabecalho**: Logo Vantari a esquerda + titulo + data/hora. Background com gradiente teal (cores da marca)
- **Linha de total**: Background teal escuro com texto branco
- **Cabecalho da tabela**: Background teal claro (#0d9488) com texto branco
- **Zebra stripes**: Linhas alternadas com cinza muito claro
- **Rodape**: "Vantari - Confidencial" centralizado
- **Cards de resumo opcionais**: Aceitar parametro `summaryCards` para exibir metricas acima da tabela
- **Status com cor**: Valores como "Vencido" em vermelho, "Pago" em verde inline

### Implementacao

**Arquivo**: `src/lib/exportUtils.ts`

1. Converter a logo PNG para base64 data URI (embutir no HTML para funcionar em window.open)
2. Expandir a assinatura de `exportToPDF` para aceitar opcoes opcionais:
   ```typescript
   interface PDFOptions {
     summaryCards?: { label: string; value: string }[];
     highlightLastRow?: boolean; // para linha de TOTAL
   }
   exportToPDF(title, headers, rows, options?)
   ```
3. Reescrever o template HTML com estilos profissionais

**Arquivos de relatorio** (6 arquivos): Atualizar chamadas para passar `summaryCards` e `highlightLastRow: true`

| Arquivo | Alteracao |
|---------|-----------|
| `src/lib/exportUtils.ts` | Reescrever template HTML com logo, cores, rodape, summary cards |
| `PayablesReport.tsx` | Passar summaryCards e highlightLastRow |
| `ReceivablesReport.tsx` | Idem |
| `PaidReport.tsx` | Idem |
| `CostCenterDashboard.tsx` | Idem |
| `TopSuppliersChart.tsx` | Idem |
| `ExecutiveSummary.tsx` | Idem |

Nenhuma dependencia nova necessaria — continua usando `window.open` + `window.print()` com HTML estilizado.

