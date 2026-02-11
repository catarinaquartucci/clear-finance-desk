import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ReembolsosList } from "@/components/Dashboard/ReembolsosList";
import { DevolucoesList } from "@/components/Dashboard/DevolucoesList";
import { NotasFiscaisList } from "@/components/Dashboard/NotasFiscaisList";
import { MateriaisList } from "@/components/Dashboard/MateriaisList";
import { NotasFiscaisMesList } from "@/components/Dashboard/NotasFiscaisMesList";
import { ApprovalSectionStats, ApprovalStats } from "@/components/Dashboard/ApprovalSectionStats";
import { ApprovalFilters, filterItemsByDate, filterItemsByStatus } from "@/components/Dashboard/ApprovalFilters";
import { useAppPreferences } from "@/contexts/AppPreferencesContext";
import { useAdminStats } from "@/hooks/useAdminStats";
import { useReembolsos } from "@/hooks/useReembolsos";
import { useDevolucoes } from "@/hooks/useDevolucoes";
import { useMateriais } from "@/hooks/useMateriais";
import { useNotasFiscais } from "@/hooks/useNotasFiscais";
import { DollarSign, TrendingUp, Receipt, Package } from "lucide-react";
import ErrorBoundary from "@/components/ErrorBoundary";

// Helper para calcular estatísticas de uma lista
const calculateStats = (items: any[] | undefined, hasValue: boolean = true): ApprovalStats => {
  if (!items) return { 
    pendentes: 0, aprovados: 0, rejeitados: 0, total: 0,
    valorPendente: 0, valorAprovado: 0, valorRejeitado: 0, valorTotal: 0,
    hasValue
  };
  
  const pendentes = items.filter(i => i.status === 'pendente');
  const aprovados = items.filter(i => i.status === 'aprovado');
  const rejeitados = items.filter(i => i.status === 'rejeitado');
  
  return {
    pendentes: pendentes.length,
    aprovados: aprovados.length,
    rejeitados: rejeitados.length,
    total: items.length,
    valorPendente: pendentes.reduce((sum, i) => sum + (i.valor || 0), 0),
    valorAprovado: aprovados.reduce((sum, i) => sum + (i.valor || 0), 0),
    valorRejeitado: rejeitados.reduce((sum, i) => sum + (i.valor || 0), 0),
    valorTotal: items.reduce((sum, i) => sum + (i.valor || 0), 0),
    hasValue
  };
};

const AdminDashboard = () => {
  const { data: stats, isLoading: isLoadingStats } = useAdminStats();
  const { approvalFilters, setApprovalFilter, clearApprovalFilters } = useAppPreferences();
  
  // Buscar dados para contadores de pendentes
  const { reembolsos } = useReembolsos();
  const { devolucoes } = useDevolucoes();
  const { materiais } = useMateriais();
  const { notasFiscais } = useNotasFiscais();

  // Aplicar filtros
  const applyFilters = <T extends { created_at: string; status: string | null }>(items: T[] | undefined): T[] => {
    const { statusFilter, periodFilter, dateFrom, dateTo } = approvalFilters;
    const dateFiltered = filterItemsByDate(items, periodFilter, dateFrom, dateTo);
    return filterItemsByStatus(dateFiltered, statusFilter);
  };

  const filteredReembolsos = applyFilters(reembolsos);
  const filteredDevolucoes = applyFilters(devolucoes);
  const filteredMateriais = applyFilters(materiais);
  const filteredNotas = applyFilters(notasFiscais);

  // Calcular estatísticas por categoria (usando dados filtrados)
  const statsReembolsos = calculateStats(filteredReembolsos, true);
  const statsDevolucoes = calculateStats(filteredDevolucoes, true);
  const statsMateriais = calculateStats(filteredMateriais, false); // Materiais não tem valor
  const statsNotas = calculateStats(filteredNotas, true);
  
  const totalPendentes = statsReembolsos.pendentes + statsDevolucoes.pendentes + 
                         statsMateriais.pendentes + statsNotas.pendentes;

  // Definir seções a expandir por padrão (as que têm pendentes)
  const defaultOpen = [];
  if (statsReembolsos.pendentes > 0) defaultOpen.push("reembolsos");
  if (statsDevolucoes.pendentes > 0) defaultOpen.push("devolucoes");
  if (statsMateriais.pendentes > 0) defaultOpen.push("materiais");
  if (statsNotas.pendentes > 0) defaultOpen.push("notas");
  // Se não houver pendentes, abrir a primeira
  if (defaultOpen.length === 0) defaultOpen.push("reembolsos");

  const handleDateRangeChange = (range: { from: Date | undefined; to: Date | undefined }) => {
    setApprovalFilter('dateFrom', range.from?.toISOString() || null);
    setApprovalFilter('dateTo', range.to?.toISOString() || null);
  };

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2 text-foreground">Aprovações</h2>
            {totalPendentes > 0 && (
              <p className="text-muted-foreground">
                {totalPendentes} solicitação(ões) pendente(s) de aprovação
              </p>
            )}
          </div>
        </div>

        {/* Barra de Filtros */}
        <ApprovalFilters
          filters={approvalFilters}
          onStatusChange={(v) => setApprovalFilter('statusFilter', v)}
          onPeriodChange={(v) => setApprovalFilter('periodFilter', v)}
          onDateRangeChange={handleDateRangeChange}
          onClearFilters={clearApprovalFilters}
        />

        {/* Accordion de Aprovações */}
        <Accordion 
          type="multiple" 
          defaultValue={defaultOpen} 
          className="space-y-3"
        >
          {/* Reembolsos */}
          <AccordionItem 
            value="reembolsos" 
            className="border border-subtle rounded-lg bg-card px-4 data-[state=open]:ring-1 data-[state=open]:ring-primary/20"
          >
            <AccordionTrigger className="hover:no-underline py-3">
              <div className="flex items-center gap-3 flex-1">
                <div className="p-2 rounded-lg bg-primary/10">
                  <DollarSign className="w-5 h-5 text-primary" />
                </div>
                <span className="font-semibold text-lg whitespace-nowrap">Reembolsos</span>
                <ApprovalSectionStats stats={statsReembolsos} variant="header" />
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-4">
              <ReembolsosList embedded data={filteredReembolsos} />
            </AccordionContent>
          </AccordionItem>

          {/* Devoluções */}
          <AccordionItem 
            value="devolucoes" 
            className="border border-subtle rounded-lg bg-card px-4 data-[state=open]:ring-1 data-[state=open]:ring-primary/20"
          >
            <AccordionTrigger className="hover:no-underline py-3">
              <div className="flex items-center gap-3 flex-1">
                <div className="p-2 rounded-lg bg-cyan/10">
                  <TrendingUp className="w-5 h-5 text-cyan" />
                </div>
                <span className="font-semibold text-lg whitespace-nowrap">Devoluções</span>
                <ApprovalSectionStats stats={statsDevolucoes} variant="header" />
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-4">
              <DevolucoesList embedded data={filteredDevolucoes} />
            </AccordionContent>
          </AccordionItem>

          {/* Materiais */}
          <AccordionItem 
            value="materiais" 
            className="border border-subtle rounded-lg bg-card px-4 data-[state=open]:ring-1 data-[state=open]:ring-primary/20"
          >
            <AccordionTrigger className="hover:no-underline py-3">
              <div className="flex items-center gap-3 flex-1">
                <div className="p-2 rounded-lg bg-neon-green/10">
                  <Package className="w-5 h-5 text-neon-green" />
                </div>
                <span className="font-semibold text-lg whitespace-nowrap">Materiais</span>
                <ApprovalSectionStats stats={statsMateriais} variant="header" />
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-4">
              <MateriaisList embedded data={filteredMateriais} />
            </AccordionContent>
          </AccordionItem>

          {/* Notas Fiscais */}
          <AccordionItem 
            value="notas" 
            className="border border-subtle rounded-lg bg-card px-4 data-[state=open]:ring-1 data-[state=open]:ring-primary/20"
          >
            <AccordionTrigger className="hover:no-underline py-3">
              <div className="flex items-center gap-3 flex-1">
                <div className="p-2 rounded-lg bg-magenta/10">
                  <Receipt className="w-5 h-5 text-magenta" />
                </div>
                <span className="font-semibold text-lg whitespace-nowrap">Notas Fiscais</span>
                <ApprovalSectionStats stats={statsNotas} variant="header" />
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-4">
              <NotasFiscaisList embedded data={filteredNotas} />
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Notas Fiscais do Mês */}
        <div>
          {isLoadingStats ? (
            <div className="text-center py-8 text-muted-foreground">Carregando notas fiscais...</div>
          ) : stats ? (
            <NotasFiscaisMesList notasFiscais={stats.notasFiscaisMes} />
          ) : null}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default AdminDashboard;
