

# Corrigir erro de resolução do módulo `xlsx`

## Problema

O Vite não consegue resolver o import do pacote `xlsx` em tempo de build. Isso é um erro de resolução de módulo do Vite (não apenas de tipos TypeScript). O pacote `xlsx` v0.18.5 tem problemas conhecidos com bundlers ESM como o Vite.

## Solução

Adicionar `xlsx` à configuração `optimizeDeps.include` no `vite.config.ts`. Isso força o Vite a pré-processar o pacote corretamente durante o build.

### Arquivo modificado: `vite.config.ts`

Adicionar a propriedade `optimizeDeps` com `include: ['xlsx']` na configuração do Vite.

