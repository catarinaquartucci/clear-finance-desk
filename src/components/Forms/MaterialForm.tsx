import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Package, Save, FileText, Trash2 } from "lucide-react";
import { useDrafts } from "@/hooks/useDrafts";
import { useDuplicate } from "@/contexts/DuplicateContext";
import { useQueryClient } from "@tanstack/react-query";

const formSchema = z.object({
  material: z.string().min(5, "Descrição do material deve ter pelo menos 5 caracteres").max(200, "Descrição muito longa"),
  centroCusto: z.enum(["Vendas", "Marketing", "Produto", "Parceria", "Operação"], {
    required_error: "Centro de custo é obrigatório",
  }),
  justificativa: z.string().min(20, "Justificativa deve ter pelo menos 20 caracteres").max(1000, "Justificativa muito longa"),
});

type FormValues = z.infer<typeof formSchema>;

export const MaterialForm = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { draft, saveDraft, isSaving, deleteDraft, hasDraft } = useDrafts('material');
  const { duplicateData, clearDuplicate } = useDuplicate();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      material: "",
      centroCusto: undefined,
      justificativa: "",
    },
  });

  // Carregar dados de duplicação (prioridade sobre rascunho)
  useEffect(() => {
    if (duplicateData?.type === 'material' && duplicateData.data) {
      form.reset(duplicateData.data as FormValues);
      clearDuplicate();
      toast.info("Formulário preenchido com dados da solicitação anterior");
    }
  }, [duplicateData, clearDuplicate, form]);

  // Carregar rascunho
  useEffect(() => {
    if (draft?.data && !duplicateData) {
      form.reset(draft.data as FormValues);
    }
  }, [draft, duplicateData, form]);

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

  // Auto-save ao desmontar (trocar de aba)
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
            type: 'material',
            data: values,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id,type' })
          .then(() => {
            console.log('Rascunho material auto-salvo');
          });
      }
    };
  }, []);

  const onSubmit = async (data: FormValues) => {
    if (!user) {
      toast.error("Você precisa estar logado para fazer uma solicitação");
      return;
    }

    setIsSubmitting(true);

    try {
      // Buscar nome do usuário do perfil
      const { data: profileData } = await supabase
        .from('profiles')
        .select('nome_completo')
        .eq('id', user.id)
        .single();

      const solicitanteNome = profileData?.nome_completo || user.email || 'Usuário';

      const { error } = await supabase
        .from('materiais')
        .insert({
          user_id: user.id,
          nome_solicitante: solicitanteNome,
          material: data.material,
          centro_custo: data.centroCusto,
          justificativa: data.justificativa,
          status: 'pendente',
        });

      if (error) throw error;

      toast.success("Solicitação de material enviada com sucesso!");

      try {
        await supabase.functions.invoke('discord-notify', {
          body: {
            type: 'material',
            data: {
              nomeSolicitante: solicitanteNome,
              material: data.material,
              centroCusto: data.centroCusto,
              justificativa: data.justificativa,
            }
          }
        });
      } catch (discordError) {
        console.error('Erro ao notificar Discord:', discordError);
      }

      // Excluir rascunho após envio bem-sucedido
      if (hasDraft) {
        deleteDraft();
      }

      form.reset();
      queryClient.invalidateQueries({ queryKey: ["my-materiais"] });
      queryClient.invalidateQueries({ queryKey: ["materiais"] });
    } catch (error: any) {
      console.error('Erro ao enviar solicitação:', error);
      toast.error("Erro ao enviar solicitação: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = () => {
    const values = form.getValues();
    saveDraft(values);
  };

  const handleDiscardDraft = () => {
    deleteDraft();
    form.reset({
      material: "",
      centroCusto: undefined,
      justificativa: "",
    });
    toast.info("Rascunho descartado");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          Solicitação de Material
        </CardTitle>
        <CardDescription>
          Preencha os dados para solicitar materiais necessários
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasDraft && (
          <Alert className="mb-4 border-primary/50 bg-primary/10">
            <FileText className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Você tem um rascunho salvo. Os dados foram carregados automaticamente.</span>
              <Button variant="ghost" size="sm" onClick={handleDiscardDraft} className="ml-2">
                <Trash2 className="w-4 h-4 mr-1" />
                Descartar
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="material"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Material</FormLabel>
                  <FormControl>
                    <Input placeholder="Descreva o material necessário" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="centroCusto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Centro de Custo</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o centro de custo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Vendas">Vendas</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Produto">Produto</SelectItem>
                      <SelectItem value="Parceria">Parceria</SelectItem>
                      <SelectItem value="Operação">Operação</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="justificativa"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Justificativa</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Explique o motivo da solicitação" 
                      className="min-h-[120px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleSaveDraft}
                disabled={isSaving}
                className="flex-1 sm:flex-none"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? "Salvando..." : "Salvar Rascunho"}
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? "Enviando..." : "Enviar Solicitação"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};
