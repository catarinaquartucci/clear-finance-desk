import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FinancialConfig {
  hublaFeePercentage: number;
  saldoLivre: number;
  saldoRetido: number;
}

const DEFAULT_HUBLA_FEE_PERCENTAGE = 20;

export function useFinancialConfig() {
  const queryClient = useQueryClient();

  const { data: config, isLoading } = useQuery({
    queryKey: ["financial-config"],
    queryFn: async (): Promise<FinancialConfig> => {
      const { data, error } = await supabase
        .from("financial_config")
        .select("key, value")
        .in("key", ["hubla_fee_percentage", "saldo_livre", "saldo_retido"]);

      if (error) {
        console.error("Error fetching financial config:", error);
        return { 
          hublaFeePercentage: DEFAULT_HUBLA_FEE_PERCENTAGE,
          saldoLivre: 0,
          saldoRetido: 0,
        };
      }

      const hublaFeeRecord = data?.find((r) => r.key === "hubla_fee_percentage");
      const saldoLivreRecord = data?.find((r) => r.key === "saldo_livre");
      const saldoRetidoRecord = data?.find((r) => r.key === "saldo_retido");
      
      return {
        hublaFeePercentage: hublaFeeRecord?.value ?? DEFAULT_HUBLA_FEE_PERCENTAGE,
        saldoLivre: saldoLivreRecord?.value ?? 0,
        saldoRetido: saldoRetidoRecord?.value ?? 0,
      };
    },
  });

  const updateHublaFeeMutation = useMutation({
    mutationFn: async (newPercentage: number) => {
      const { error } = await supabase
        .from("financial_config")
        .upsert(
          { key: "hubla_fee_percentage", value: newPercentage },
          { onConflict: "key" }
        );

      if (error) throw error;
      return newPercentage;
    },
    onSuccess: (newPercentage) => {
      queryClient.invalidateQueries({ queryKey: ["financial-config"] });
      toast.success(`Taxa Hubla atualizada para ${newPercentage}%`);
    },
    onError: (error) => {
      console.error("Error updating Hubla fee:", error);
      toast.error("Erro ao atualizar taxa Hubla");
    },
  });

  const updateSaldoLivreMutation = useMutation({
    mutationFn: async (newValue: number) => {
      const { error } = await supabase
        .from("financial_config")
        .upsert(
          { key: "saldo_livre", value: newValue },
          { onConflict: "key" }
        );

      if (error) throw error;
      return newValue;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-config"] });
      toast.success("Saldo livre atualizado");
    },
    onError: (error) => {
      console.error("Error updating saldo livre:", error);
      toast.error("Erro ao atualizar saldo livre");
    },
  });

  const updateSaldoRetidoMutation = useMutation({
    mutationFn: async (newValue: number) => {
      const { error } = await supabase
        .from("financial_config")
        .upsert(
          { key: "saldo_retido", value: newValue },
          { onConflict: "key" }
        );

      if (error) throw error;
      return newValue;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial-config"] });
      toast.success("Saldo retido atualizado");
    },
    onError: (error) => {
      console.error("Error updating saldo retido:", error);
      toast.error("Erro ao atualizar saldo retido");
    },
  });

  // Query to get total bank balance
  const { data: bankTotal, refetch: refetchBankTotal } = useQuery({
    queryKey: ["bank-accounts-total"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bank_accounts")
        .select("current_balance")
        .eq("active", true);

      if (error) {
        console.error("Error fetching bank accounts total:", error);
        return 0;
      }

      return data?.reduce((sum, acc) => sum + (Number(acc.current_balance) || 0), 0) ?? 0;
    },
  });

  const syncFromBankAccountsMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from("bank_accounts")
        .select("current_balance")
        .eq("active", true);

      if (error) throw error;

      const total = data?.reduce((sum, acc) => sum + (Number(acc.current_balance) || 0), 0) ?? 0;

      const { error: upsertError } = await supabase
        .from("financial_config")
        .upsert(
          { key: "saldo_livre", value: total },
          { onConflict: "key" }
        );

      if (upsertError) throw upsertError;
      return total;
    },
    onSuccess: (total) => {
      queryClient.invalidateQueries({ queryKey: ["financial-config"] });
      queryClient.invalidateQueries({ queryKey: ["bank-accounts-total"] });
      toast.success(`Saldo livre sincronizado: R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    },
    onError: (error) => {
      console.error("Error syncing from bank accounts:", error);
      toast.error("Erro ao sincronizar saldo bancário");
    },
  });

  return {
    hublaFeePercentage: config?.hublaFeePercentage ?? DEFAULT_HUBLA_FEE_PERCENTAGE,
    saldoLivre: config?.saldoLivre ?? 0,
    saldoRetido: config?.saldoRetido ?? 0,
    isLoading,
    updateHublaFee: updateHublaFeeMutation.mutate,
    updateSaldoLivre: updateSaldoLivreMutation.mutate,
    updateSaldoRetido: updateSaldoRetidoMutation.mutate,
    isUpdating: updateHublaFeeMutation.isPending,
    isUpdatingSaldoLivre: updateSaldoLivreMutation.isPending,
    isUpdatingSaldoRetido: updateSaldoRetidoMutation.isPending,
    bankTotal: bankTotal ?? 0,
    syncFromBankAccounts: syncFromBankAccountsMutation.mutate,
    isSyncingFromBank: syncFromBankAccountsMutation.isPending,
  };
}
