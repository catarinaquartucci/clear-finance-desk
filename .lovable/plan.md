

# Importar Contas a Pagar do PDF da Vantari

## Dados Extraídos
- **27 páginas** com aproximadamente **400+ registros** de contas a pagar
- Todos com status **PREVISTO** (aberto)
- Período: **março/2026 a junho/2028**
- Total geral: **R$ 1.528.957,15**
- Filial: **Vantari** (`3d37326f-bedc-4a16-b81f-0213c826d423`)

## Categorias identificadas
PRÓ LABORE, BÔNUS, ALUGUEL, CONTABILIDADE, MARKETING, SISTEMA DE GESTÃO, TELEFONIA MÓVEL, TELEFONIA FIXA, ELABORAÇÃO DE CÁLCULOS, DESPESAS COM FUNCIONÁRIOS, ANÚNCIOS, CRM, GOOGLE, OAB, CERTIFICADO DIGITAL, CAIXINHA

## Plano de Implementação

### 1. Criar Edge Function para importação em lote
Uma função backend `import-payables` que recebe um array JSON de contas a pagar e faz bulk insert na tabela `payables`. Isso é necessário porque são 400+ registros -- inserir um a um seria inviável.

### 2. Criar script de dados e executar a importação
Mapear os campos do PDF para a tabela `payables`:
- `description` = Histórico (texto descritivo)
- `amount` = Vlr. Bruto (convertido de "2.000,00" para 2000.00)
- `due_date` = Dt. Vencto. (convertido de dd/mm/yyyy para yyyy-mm-dd)
- `status` = "open"
- `payment_method` = mapeado de "Boleto" ou "Extrato" para "boleto" ou "transferencia"
- `notes` = Tipo de Despesa (categoria da despesa)
- `company_id` = ID da Vantari

### 3. Executar a importação
Chamar a edge function com os dados extraídos do PDF para inserir todos os registros de uma vez.

### Arquivos a criar/editar
- `supabase/functions/import-payables/index.ts` -- nova edge function para bulk insert

