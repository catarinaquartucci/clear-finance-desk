import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Invoice {
  id: string;
  customer_id: string | null;
  receivable_id: string | null;
  invoice_number: string | null;
  service_description: string;
  amount: number;
  tax_amount: number;
  net_amount: number;
  status: string;
  issued_at: string | null;
  cancelled_at: string | null;
  notes: string | null;
  pdf_url: string | null;
  created_at: string;
  updated_at: string;
  customers?: { name: string } | null;
}

export type InvoiceInsert = {
  customer_id?: string | null;
  receivable_id?: string | null;
  invoice_number?: string | null;
  service_description: string;
  amount: number;
  tax_amount?: number;
  net_amount?: number;
  status?: string;
  issued_at?: string | null;
  notes?: string | null;
};

export const useInvoices = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*, customers:customer_id(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Invoice[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (invoice: InvoiceInsert) => {
      const taxAmount = invoice.tax_amount ?? invoice.amount * 0.087;
      const netAmount = invoice.net_amount ?? invoice.amount - taxAmount;
      const { data, error } = await supabase
        .from("invoices")
        .insert({ ...invoice, tax_amount: taxAmount, net_amount: netAmount })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Nota fiscal criada com sucesso");
    },
    onError: (err: any) => toast.error("Erro ao criar nota fiscal: " + err.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: { id: string } & Partial<InvoiceInsert>) => {
      const { error } = await supabase.from("invoices").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Nota fiscal atualizada");
    },
    onError: (err: any) => toast.error("Erro: " + err.message),
  });

  const issueMutation = useMutation({
    mutationFn: async (id: string) => {
      // Generate sequential invoice number
      const { data: latest } = await supabase
        .from("invoices")
        .select("invoice_number")
        .not("invoice_number", "is", null)
        .order("invoice_number", { ascending: false })
        .limit(1);
      
      const lastNum = latest?.[0]?.invoice_number ? parseInt(latest[0].invoice_number) : 0;
      const nextNum = String(lastNum + 1).padStart(6, "0");

      const { error } = await supabase
        .from("invoices")
        .update({ 
          status: "issued", 
          issued_at: new Date().toISOString(),
          invoice_number: nextNum 
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Nota fiscal emitida com sucesso");
    },
    onError: (err: any) => toast.error("Erro: " + err.message),
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("invoices")
        .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Nota fiscal cancelada");
    },
    onError: (err: any) => toast.error("Erro: " + err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("invoices").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Nota fiscal excluída");
    },
    onError: (err: any) => toast.error("Erro: " + err.message),
  });

  // Stats
  const stats = {
    total: query.data?.length ?? 0,
    draft: query.data?.filter((i) => i.status === "draft").length ?? 0,
    issued: query.data?.filter((i) => i.status === "issued").length ?? 0,
    cancelled: query.data?.filter((i) => i.status === "cancelled").length ?? 0,
    totalAmount: query.data?.filter((i) => i.status === "issued").reduce((s, i) => s + Number(i.amount), 0) ?? 0,
  };

  return {
    invoices: query.data ?? [],
    isLoading: query.isLoading,
    stats,
    createInvoice: createMutation.mutateAsync,
    updateInvoice: updateMutation.mutateAsync,
    issueInvoice: issueMutation.mutateAsync,
    cancelInvoice: cancelMutation.mutateAsync,
    deleteInvoice: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isIssuing: issueMutation.isPending,
  };
};
