import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ItauCredential {
  id: string;
  company_id: string | null;
  bank_account_id: string;
  client_id: string;
  agencia: string;
  conta: string;
  environment: "sandbox" | "production";
  ativo: boolean;
  last_sync_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ItauCredentialFormInput {
  id?: string;
  company_id: string | null;
  bank_account_id: string;
  client_id: string;
  client_secret?: string; // só no cadastro/edição
  cert_pem?: string;
  key_pem?: string;
  agencia: string;
  conta: string;
  environment: "sandbox" | "production";
  ativo?: boolean;
}

export interface ItauSyncLog {
  id: string;
  credential_id: string | null;
  started_at: string;
  finished_at: string | null;
  period_from: string | null;
  period_to: string | null;
  transactions_imported: number;
  transactions_skipped: number;
  status: "running" | "success" | "partial" | "error";
  error_message: string | null;
  triggered_by: string | null;
}

export const useItauCredentials = (companyId?: string | null) => {
  const qc = useQueryClient();

  const { data: credentials, isLoading } = useQuery({
    queryKey: ["itau-credentials", companyId ?? "all"],
    queryFn: async () => {
      let q = supabase.from("itau_credentials").select("*").order("created_at", { ascending: false });
      if (companyId) q = q.eq("company_id", companyId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as ItauCredential[];
    },
  });

  const upsert = useMutation({
    mutationFn: async (input: ItauCredentialFormInput) => {
      // 1) Upsert da linha (sem secrets)
      const { id, client_secret, cert_pem, key_pem, ...row } = input;
      let credentialId = id;

      if (id) {
        const { error } = await supabase
          .from("itau_credentials")
          .update(row)
          .eq("id", id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("itau_credentials")
          .insert({ ...row, ativo: row.ativo ?? true })
          .select()
          .single();
        if (error) throw error;
        credentialId = data.id;
      }

      // 2) Salva secrets (se informados)
      if (credentialId && (client_secret || cert_pem || key_pem)) {
        const { error } = await supabase.functions.invoke(
          "itau-credentials-manager/upsert",
          {
            body: { credential_id: credentialId, client_secret, cert_pem, key_pem },
          },
        );
        if (error) throw error;
      }
      return credentialId!;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["itau-credentials"] });
      toast.success("Credencial salva!");
    },
    onError: (e: any) => toast.error("Erro ao salvar: " + (e?.message ?? "")),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      // Apaga secrets primeiro (best-effort)
      try {
        await supabase.functions.invoke("itau-credentials-manager/delete", {
          body: { credential_id: id },
        });
      } catch (_) { /* ignore */ }
      const { error } = await supabase.from("itau_credentials").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["itau-credentials"] });
      toast.success("Credencial removida");
    },
    onError: (e: any) => toast.error("Erro: " + (e?.message ?? "")),
  });

  const testConnection = useMutation({
    mutationFn: async (input: {
      environment: "sandbox" | "production";
      client_id: string;
      client_secret: string;
      cert_pem: string;
      key_pem: string;
      agencia: string;
      conta: string;
    }) => {
      const { data, error } = await supabase.functions.invoke(
        "itau-credentials-manager/test",
        { body: input },
      );
      if (error) throw error;
      return data;
    },
  });

  const syncNow = useMutation({
    mutationFn: async (args: { credential_id?: string; days?: number }) => {
      const { data, error } = await supabase.functions.invoke("itau-sync-extrato", {
        body: args,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ["itau-credentials"] });
      qc.invalidateQueries({ queryKey: ["itau-sync-log"] });
      qc.invalidateQueries({ queryKey: ["bank-transactions"] });
      toast.success(`Sync concluído: ${data?.total_imported ?? 0} lançamento(s) importado(s)`);
    },
    onError: (e: any) => toast.error("Erro no sync: " + (e?.message ?? "")),
  });

  return { credentials, isLoading, upsert, remove, testConnection, syncNow };
};

export const useItauSyncLog = (credentialId?: string) => {
  return useQuery({
    queryKey: ["itau-sync-log", credentialId ?? "all"],
    queryFn: async () => {
      let q = supabase
        .from("itau_sync_log")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(50);
      if (credentialId) q = q.eq("credential_id", credentialId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as ItauSyncLog[];
    },
  });
};
