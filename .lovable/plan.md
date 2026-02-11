

## Plano: Corrigir Auto-Save no NotaFiscalForm

### Problema Identificado

O formulário `NotaFiscalForm` possui integração com o hook `useDrafts` para carregar rascunhos salvos, mas **não implementa o mecanismo de auto-save automático ao desmontar** (quando o usuário troca de tela ou aba). Isso causa perda de dados preenchidos.

Os formulários `ReembolsoForm`, `DevolucaoForm` e `MaterialForm` já possuem essa implementação funcionando corretamente.

### Arquivo a Modificar

`src/components/Forms/NotaFiscalForm.tsx`

### Alterações Necessárias

Adicionar o mesmo padrão de auto-save usado nos outros formulários, logo após o useEffect que carrega o rascunho (linha 76):

```typescript
import { useState, useEffect, useRef } from "react"; // Adicionar useRef

// ... dentro do componente, após linha 76:

// Ref para acessar valores atualizados no cleanup
const formValuesRef = useRef<FormValues>();
const userRef = useRef(user);

// Manter refs atualizadas
useEffect(() => {
  formValuesRef.current = form.getValues();
  userRef.current = user;
});

// Observar mudanças no form para atualizar ref
useEffect(() => {
  const subscription = form.watch((values) => {
    formValuesRef.current = values as FormValues;
  });
  return () => subscription.unsubscribe();
}, [form]);

// Auto-save ao desmontar (trocar de aba/tela)
useEffect(() => {
  return () => {
    const values = formValuesRef.current;
    const currentUser = userRef.current;
    
    if (!values || !currentUser) return;
    
    const hasContent = Object.values(values).some(v => 
      v !== "" && v !== undefined && v !== null
    );
    
    if (hasContent) {
      // Salvar silenciosamente (sem toast)
      supabase
        .from("drafts")
        .upsert({
          user_id: currentUser.id,
          type: 'nota_fiscal',
          data: values,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,type' })
        .then(() => {
          console.log('Rascunho nota_fiscal auto-salvo');
        });
    }
  };
}, []);
```

### Resumo Técnico

| Componente | Modificação |
|------------|-------------|
| **Import** | Adicionar `useRef` ao import existente de `useState, useEffect` |
| **Refs** | Criar `formValuesRef` e `userRef` para manter valores atualizados |
| **Watcher** | Observar mudanças no formulário e atualizar a ref |
| **Cleanup** | Implementar useEffect com função de retorno que salva no banco ao desmontar |

### Resultado Esperado

Quando o usuário estiver preenchendo o formulário de Nota Fiscal e:
1. Trocar de página
2. Navegar para outra seção do sistema
3. Fechar a aba

O sistema automaticamente salvará os dados preenchidos como rascunho no banco de dados. Ao retornar, os dados serão restaurados automaticamente.

