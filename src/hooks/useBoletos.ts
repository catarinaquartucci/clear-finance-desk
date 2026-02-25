import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Boleto {
  id: string;
  receivable_id: string | null;
  customer_id: string | null;
  amount: number;
  due_date: string;
  status: string;
  barcode: string | null;
  our_number: string | null;
  pdf_url: string | null;
  sent_at: string | null;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  customers?: { name: string } | null;
}

export type BoletoInsert = {
  receivable_id?: string | null;
  customer_id?: string | null;
  amount: number;
  due_date: string;
  notes?: string | null;
};

export const useBoletos = () => {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["boletos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("boletos")
        .select("*, customers:customer_id(name)")
        .order("due_date", { ascending: false });
      if (error) throw error;
      return data as Boleto[];
    },
  });

  const create = useMutation({
    mutationFn: async (b: BoletoInsert) => {
      // Generate a simulated our_number
      const { data: latest } = await supabase
        .from("boletos")
        .select("our_number")
        .not("our_number", "is", null)
        .order("our_number", { ascending: false })
        .limit(1);
      const lastNum = latest?.[0]?.our_number ? parseInt(latest[0].our_number) : 0;
      const ourNumber = String(lastNum + 1).padStart(8, "0");

      // Simulated barcode
      const barcode = `23793.${ourNumber.slice(0, 5)} ${ourNumber.slice(5)}.000000 00000.000000 0 ${Math.floor(Math.random() * 9000 + 1000)}0000${Math.round(b.amount * 100).toString().padStart(10, "0")}`;

      const { data, error } = await supabase
        .from("boletos")
        .insert({ ...b, our_number: ourNumber, barcode })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["boletos"] });
      toast.success("Boleto gerado com sucesso");
    },
    onError: (err: any) => toast.error("Erro: " + err.message),
  });

  const markSent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("boletos")
        .update({ status: "sent", sent_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["boletos"] });
      toast.success("Boleto marcado como enviado");
    },
    onError: (err: any) => toast.error("Erro: " + err.message),
  });

  const markPaid = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("boletos")
        .update({ status: "paid", paid_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["boletos"] });
      toast.success("Boleto marcado como pago");
    },
    onError: (err: any) => toast.error("Erro: " + err.message),
  });

  const cancel = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("boletos")
        .update({ status: "cancelled" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["boletos"] });
      toast.success("Boleto cancelado");
    },
    onError: (err: any) => toast.error("Erro: " + err.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("boletos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["boletos"] });
      toast.success("Boleto excluído");
    },
    onError: (err: any) => toast.error("Erro: " + err.message),
  });

  const today = new Date().toISOString().slice(0, 10);
  const stats = {
    total: query.data?.length ?? 0,
    generated: query.data?.filter((b) => b.status === "generated").length ?? 0,
    sent: query.data?.filter((b) => b.status === "sent").length ?? 0,
    paid: query.data?.filter((b) => b.status === "paid").length ?? 0,
    overdue: query.data?.filter((b) => ["generated", "sent"].includes(b.status) && b.due_date < today).length ?? 0,
    totalOpen: query.data
      ?.filter((b) => ["generated", "sent"].includes(b.status))
      .reduce((s, b) => s + Number(b.amount), 0) ?? 0,
  };

  return {
    boletos: query.data ?? [],
    isLoading: query.isLoading,
    stats,
    createBoleto: create.mutateAsync,
    markSent: markSent.mutateAsync,
    markPaid: markPaid.mutateAsync,
    cancelBoleto: cancel.mutateAsync,
    deleteBoleto: remove.mutateAsync,
    isCreating: create.isPending,
  };
};
