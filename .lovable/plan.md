

# Permitir PDF e TXT no upload de conciliação bancária

## Situação atual
- O input aceita: `.ofx, .ofc, .csv, .txt`
- O parser (`bankStatementParser.ts`) trata OFX, OFC, CSV e TXT
- PDF **não** é aceito nem no input nem no parser

## Plano

### 1. Adicionar `.pdf` ao accept do input
Em `ImportStatementDialog.tsx`, linha 93: adicionar `.pdf` ao atributo `accept`.

### 2. Instalar `pdfjs-dist` para extração de texto client-side
Necessário para ler o conteúdo textual do PDF no navegador antes de passá-lo ao parser CSV/texto existente.

### 3. Criar função `parsePDF` em `bankStatementParser.ts`
- Usar `pdfjs-dist` para extrair texto de todas as páginas
- Concatenar o texto extraído e tentar parsear como CSV (detectando colunas data/valor/descrição)
- Reutilizar o parser CSV genérico existente sobre o texto extraído

### 4. Atualizar `parseStatement` para tratar extensão `.pdf`
Adicionar case `.pdf` que lê o arquivo como `ArrayBuffer` (em vez de `.text()`), extrai texto via pdfjs, e passa ao parser CSV.

### 5. Ajustar `ImportStatementDialog` para ler arquivo como ArrayBuffer quando for PDF
O `handleFile` atualmente usa `file.text()`. Para PDFs, precisará usar `file.arrayBuffer()` e passar ao novo fluxo de parsing.

### Arquivos a editar
- `src/components/finance/reconciliation/ImportStatementDialog.tsx` — accept + lógica de leitura PDF
- `src/lib/bankStatementParser.ts` — nova função `parsePDF` + atualização do `parseStatement`
- `package.json` — adicionar `pdfjs-dist`

