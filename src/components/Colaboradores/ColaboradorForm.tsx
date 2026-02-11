import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Colaborador } from "@/hooks/useColaboradores";

const formSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  cpf: z.string().min(11, "CPF inválido"),
  email: z.string().email("Email inválido"),
  cnpj: z.string().optional(),
  endereco: z.string().optional(),
  chave_pix_cnpj: z.string().optional(),
  data_inicio_contrato: z.string().min(1, "Data de início é obrigatória"),
  data_fim_contrato: z.string().optional(),
  area: z.string().min(1, "Área é obrigatória"),
  funcao: z.string().min(1, "Função é obrigatória"),
  remuneracao: z.coerce.number().positive("Remuneração deve ser positiva"),
  variavel: z.string().optional(),
  regra_ote: z.string().optional(),
  data_nascimento: z.string().optional(),
  is_admin: z.boolean().default(false),
  has_finance_access: z.boolean().default(false),
  has_finance_view_access: z.boolean().default(false),
  has_admin_view_access: z.boolean().default(false),
  ativo: z.boolean().default(true),
});

interface ColaboradorFormProps {
  colaborador?: Colaborador;
  onSubmit: (data: any) => void;
  isLoading: boolean;
}

export const ColaboradorForm = ({ colaborador, onSubmit, isLoading }: ColaboradorFormProps) => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: colaborador ? {
      nome: colaborador.nome,
      cpf: colaborador.cpf,
      email: colaborador.email,
      cnpj: colaborador.cnpj || "",
      endereco: colaborador.endereco || "",
      chave_pix_cnpj: colaborador.chave_pix_cnpj || "",
      data_inicio_contrato: colaborador.data_inicio_contrato,
      data_fim_contrato: colaborador.data_fim_contrato || "",
      area: colaborador.area,
      funcao: colaborador.funcao,
      remuneracao: colaborador.remuneracao,
      variavel: colaborador.variavel || "",
      regra_ote: colaborador.regra_ote || "",
      data_nascimento: colaborador.data_nascimento || "",
      is_admin: colaborador.is_admin,
      has_finance_access: colaborador.has_finance_access,
      has_finance_view_access: (colaborador as any).has_finance_view_access ?? false,
      has_admin_view_access: (colaborador as any).has_admin_view_access ?? false,
      ativo: colaborador.ativo,
    } : {
      nome: "",
      cpf: "",
      email: "",
      cnpj: "",
      endereco: "",
      chave_pix_cnpj: "",
      data_inicio_contrato: "",
      data_fim_contrato: "",
      area: "",
      funcao: "",
      remuneracao: 0,
      variavel: "",
      regra_ote: "",
      data_nascimento: "",
      is_admin: false,
      has_finance_access: false,
      has_finance_view_access: false,
      has_admin_view_access: false,
      ativo: true,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Dados Pessoais</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome completo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cpf"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CPF</FormLabel>
                  <FormControl>
                    <Input placeholder="000.000.000-00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="email@exemplo.com" {...field} disabled={!!colaborador} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="data_nascimento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Nascimento (opcional)</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Dados Empresariais</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="cnpj"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CNPJ (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="00.000.000/0000-00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="chave_pix_cnpj"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Chave PIX CNPJ (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Chave PIX" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="endereco"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Endereço (opcional)</FormLabel>
                <FormControl>
                  <Textarea placeholder="Endereço completo" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Dados Contratuais</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="data_inicio_contrato"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Início</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="data_fim_contrato"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Término (opcional)</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="area"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Área</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Tecnologia, Marketing" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="funcao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Função</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Desenvolvedor, Analista" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="remuneracao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Remuneração Fixa (R$)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="0.00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="variavel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Variável (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: 10%, R$ 2.000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="regra_ote"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Regra OTE (opcional)</FormLabel>
                <FormControl>
                  <Textarea placeholder="Descreva a regra de OTE (On-Target Earnings)" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Controle de Acesso</h3>
          <div className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="is_admin"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border border-subtle p-4 bg-card-dark">
                  <div className="space-y-0.5">
                    <FormLabel>Permissão de Administrador</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Permite acesso completo à área administrativa
                    </p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="has_admin_view_access"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border border-subtle p-4 bg-card-dark">
                  <div className="space-y-0.5">
                    <FormLabel>Visualização Admin (Somente Leitura)</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Permite visualizar o painel administrativo sem poder editar
                    </p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="has_finance_access"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border border-subtle p-4 bg-card-dark">
                  <div className="space-y-0.5">
                    <FormLabel>Acesso ao Financeiro</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Permite acesso completo ao módulo financeiro
                    </p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="has_finance_view_access"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border border-subtle p-4 bg-card-dark">
                  <div className="space-y-0.5">
                    <FormLabel>Visualização Financeiro (Somente Leitura)</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Permite visualizar o módulo financeiro sem poder editar
                    </p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ativo"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border border-subtle p-4 bg-card-dark">
                  <div className="space-y-0.5">
                    <FormLabel>Colaborador Ativo</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Define se o colaborador está ativo no sistema
                    </p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Salvando..." : colaborador ? "Atualizar" : "Criar Colaborador"}
          </Button>
        </div>
      </form>
    </Form>
  );
};
