

# Corrigir erro de build do módulo `xlsx`

## Problema

O projeto não compila porque o TypeScript não encontra as declarações de tipo do pacote `xlsx`. Embora o pacote esteja instalado, ele não inclui tipos nativos e não há `@types/xlsx` disponível.

## Solução

Criar um arquivo de declaração de tipos customizado para o módulo `xlsx` em `src/types/xlsx.d.ts`. Isso resolve o erro em todos os 4 arquivos afetados de uma vez.

### Arquivo novo: `src/types/xlsx.d.ts`

Declarar o módulo `xlsx` com `declare module 'xlsx'` exportando os tipos usados no projeto (`utils`, `writeFile`, `read`, `WorkBook`, `WorkSheet`).

### Nenhum outro arquivo precisa ser alterado

O `tsconfig.app.json` já inclui `src` no escopo de compilação, então o `.d.ts` será detectado automaticamente.

