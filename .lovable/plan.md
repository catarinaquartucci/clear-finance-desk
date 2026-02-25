
# Rebranding: Viver de IA -> Vantari

## Resumo
Substituir toda a identidade visual "Viver de IA" pela marca Vantari, usando o logo enviado e adaptando as cores do sistema para combinar com a paleta teal/verde-azulado do logo.

## Cores extraidas do logo Vantari
- Teal escuro: ~`hsl(185, 80%, 26%)` (#0D7377)
- Teal/verde claro: ~`hsl(165, 100%, 35%)` (#00B4A0)
- Gradiente: do azul-teal ao verde-teal

## Mudancas

### 1. Logo
- Copiar `Logo-Vantari-horizontal.png` para `src/assets/vantari-logo.png`
- Atualizar `src/components/Brand/Logo.tsx` para usar o novo logo

### 2. Cores (src/index.css)
- **Primary** (dark): de `180 87% 50%` (ciano) para `185 80% 26%` (teal Vantari)
- **Ring/focus**: ajustar para teal
- **Brand colors**: substituir cyan/blue por tons teal do Vantari
- **Gradients**: adaptar gradient-primary para gradiente teal->verde do logo
- **Light mode**: ajustar primary igualmente

### 3. Textos e referencias
- `Header.tsx`: trocar "Central Financeira" ou manter como subtitulo
- `Auth.tsx`: remover placeholder `@viverdeia.ai`, atualizar textos
- `Auth.tsx`: remover restricao de dominio `viverdeia.ai` / `g4educacao.com`
- `Index.tsx`: atualizar titulos do hero section

### 4. Tailwind config
- Atualizar cores `brand-*` e `cyan` para tons teal Vantari

### 5. Theme storage key
- `src/components/theme-provider.tsx`: trocar `viver-de-ia-theme` para `vantari-theme`

### 6. Titulo da pagina
- `index.html`: atualizar `<title>` para "Vantari"

## Detalhes tecnicos
- Arquivos modificados: ~8 arquivos
- Sem mudancas no banco de dados
- Sem novas dependencias
