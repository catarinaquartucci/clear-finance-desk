

# Corrigir Parser para Formato OFC (Itau)

## Problema

O arquivo enviado (`Extrato_0429_994536_27-02-2026.ofc`) usa o formato OFC 1.x, que e diferente do OFX:
- **OFX**: usa tags com fechamento (`<STMTTRN>...</STMTTRN>`)
- **OFC**: usa tags **sem fechamento** - cada `<STMTTRN>` delimita o inicio de uma transacao, e a proxima `<STMTTRN>` ou fim do bloco delimita o fim

O parser atual usa a regex `/<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi`, que exige tag de fechamento e portanto nunca encontra transacoes em arquivos OFC.

## Solucao

Atualizar o parser em `src/lib/bankStatementParser.ts` para:

1. **Detectar formato OFC vs OFX**: Verificar se o conteudo tem tags de fechamento (`</STMTTRN>`) ou nao
2. **Parser OFC dedicado**: Criar funcao `parseOFC()` que divide o conteudo por `<STMTTRN>` sem esperar tag de fechamento
3. **Manter compatibilidade**: O parser OFX existente continua funcionando normalmente para arquivos `.ofx`

## Detalhes Tecnicos

### Arquivo: `src/lib/bankStatementParser.ts`

- Adicionar funcao `parseOFC()` que usa regex `/<STMTTRN>/gi` para dividir o conteudo em blocos (split por ocorrencia da tag)
- Cada bloco e parseado extraindo `<DTPOSTED>`, `<TRNAMT>`, `<MEMO>`, `<FITID>` etc com a mesma logica de `getValue` existente
- Na funcao `parseStatement()`, separar o tratamento de `.ofc` e `.ofx` - chamar `parseOFC()` para `.ofc` e `parseOFX()` para `.ofx`
- Manter deteccao do Itau (`<BANKID>341`) funcionando em ambos os formatos

### Nenhuma mudanca de banco de dados ou credencial necessaria
Esta correcao e puramente no parser frontend - nao requer nenhuma configuracao adicional.
