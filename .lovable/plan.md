

# Integracao com Banco Itau

## Contexto

A integracao completa com o Itau envolve multiplas camadas. Vou organizar em fases, da mais simples a mais complexa, para que voce possa comecar a usar rapidamente enquanto preparamos as integracoes mais avancadas.

---

## Fase 1 - Parser Otimizado para Itau (Imediata)

Melhorar o parser existente de OFX/CSV para reconhecer o formato especifico do Itau:

- **OFX do Itau**: Extrair campos adicionais como numero do documento, agencia, e categorias do Itau
- **CSV do Itau**: Reconhecer o layout especifico de exportacao do Internet Banking Itau (colunas: Data, Lançamento, Ag./Origem, Valor, Saldo)
- **Auto-deteccao**: Identificar automaticamente que o arquivo e do Itau pelo header OFX (`<BANKID>341`)
- Exibir badge "Itau" na importacao quando detectado

**Arquivos afetados:**
- `src/lib/bankStatementParser.ts` - Adicionar parser especifico Itau
- `src/components/finance/reconciliation/ImportStatementDialog.tsx` - UI de feedback

---

## Fase 2 - Conciliacao Automatica Inteligente (Imediata)

Criar motor de conciliacao automatica que cruza transacoes do extrato com contas a pagar/receber:

- **Match por valor + data**: Encontrar payables/receivables com mesmo valor e data proxima (+-3 dias)
- **Match por descricao**: Usar palavras-chave da descricao do extrato para sugerir matches
- **Botao "Conciliar Automaticamente"**: Processar todas as transacoes pendentes de uma vez
- **Score de confianca**: Mostrar % de certeza para cada sugestao de match

**Arquivos afetados:**
- `src/components/finance/reconciliation/ReconciliationPanel.tsx` - Botao de auto-conciliacao
- Novo: `src/lib/autoConciliation.ts` - Motor de matching
- `src/hooks/useBankTransactions.ts` - Mutation de conciliacao em lote

---

## Fase 3 - API Itau (Requer Credenciais)

Integracao via API do Itau para consultas automaticas. **Requisitos previos:**

1. Cadastro no Portal de Desenvolvedores Itau (https://developer.itau.com.br)
2. Obter `client_id` e `client_secret`
3. Certificado digital (mTLS) para autenticacao

**Funcionalidades:**
- Consulta de saldo em tempo real
- Download automatico de extratos
- Sincronizacao periodica via automacao

**Implementacao:**
- Nova edge function `itau-sync/index.ts` para comunicacao com a API
- Armazenar credenciais como secrets no backend
- Nova tabela `itau_config` para configuracoes da integracao
- Pagina de configuracao na area financeira

---

## Fase 4 - Pagamentos via Itau (Requer API + Aprovacao)

Envio de pagamentos diretamente pelo sistema:

- **PIX**: Enviar transferencias PIX para fornecedores cadastrados
- **Boletos**: Pagar boletos registrados no sistema
- **TED/DOC**: Transferencias bancarias
- **Fluxo de aprovacao**: Dupla aprovacao para pagamentos acima de determinado valor

**Esta fase requer:**
- API Itau com escopo de pagamentos (nivel de permissao mais alto)
- Certificado A1/A3 da empresa
- Aprovacao do Itau para operacoes de pagamento

---

## Plano de Implementacao Imediato

Vou implementar as **Fases 1 e 2** agora, pois nao dependem de credenciais externas:

1. Parser otimizado para formato Itau (OFX e CSV)
2. Motor de conciliacao automatica com sugestoes inteligentes
3. UI para conciliacao em lote

Para as Fases 3 e 4, voce precisara criar uma conta no Portal de Desenvolvedores do Itau e obter as credenciais de API.

---

## Detalhes Tecnicos

### Parser Itau (bankStatementParser.ts)
- Funcao `parseItauCSV()` com layout especifico (separador `;`, formato de data `DD/MM/YYYY`, valor com virgula)
- Deteccao automatica por `<BANKID>341` no OFX ou header CSV do Itau
- Extracao de campos extras: numero documento, agencia origem

### Auto-Conciliacao (autoConciliation.ts)
- Algoritmo de matching: valor exato + janela de data de 3 dias
- Fuzzy matching na descricao usando palavras-chave do fornecedor/cliente
- Score de confianca: 100% (valor+data+nome exato), 80% (valor+data), 60% (valor similar)
- Threshold configuravel para conciliacao automatica vs. sugestao manual

### Componentes UI
- Botao "Conciliar Automaticamente" no painel de conciliacao
- Dialog de revisao mostrando matches sugeridos antes de confirmar
- Indicador visual de matches com score de confianca

