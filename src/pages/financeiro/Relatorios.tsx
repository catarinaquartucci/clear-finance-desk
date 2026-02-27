import { FileBarChart } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DREReport } from "@/components/finance/reports/DREReport";
import { AgingReport } from "@/components/finance/reports/AgingReport";
import { PayablesReport } from "@/components/finance/reports/PayablesReport";
import { ReceivablesReport } from "@/components/finance/reports/ReceivablesReport";
import { PaidReport } from "@/components/finance/reports/PaidReport";
import { CostCenterDashboard } from "@/components/finance/reports/CostCenterDashboard";
import { MonthlyFlowChart } from "@/components/finance/reports/MonthlyFlowChart";
import { TopSuppliersChart } from "@/components/finance/reports/TopSuppliersChart";
import { ExecutiveSummary } from "@/components/finance/reports/ExecutiveSummary";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

const Relatorios = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <FileBarChart className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Relatórios Financeiros</h1>
          <p className="text-sm text-muted-foreground">
            Relatórios, dashboards e exportação de dados financeiros
          </p>
        </div>
      </div>

      <Tabs defaultValue="summary">
        <ScrollArea className="w-full">
          <TabsList className="inline-flex w-auto min-w-full">
            <TabsTrigger value="summary">Resumo Executivo</TabsTrigger>
            <TabsTrigger value="payables">Contas a Pagar</TabsTrigger>
            <TabsTrigger value="receivables">Contas a Receber</TabsTrigger>
            <TabsTrigger value="paid">Contas Pagas</TabsTrigger>
            <TabsTrigger value="costcenter">Centros de Custo</TabsTrigger>
            <TabsTrigger value="monthly">Fluxo Mensal</TabsTrigger>
            <TabsTrigger value="suppliers">Top Fornecedores</TabsTrigger>
            <TabsTrigger value="dre">DRE</TabsTrigger>
            <TabsTrigger value="aging">Aging</TabsTrigger>
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <TabsContent value="summary" className="mt-4"><ExecutiveSummary /></TabsContent>
        <TabsContent value="payables" className="mt-4"><PayablesReport /></TabsContent>
        <TabsContent value="receivables" className="mt-4"><ReceivablesReport /></TabsContent>
        <TabsContent value="paid" className="mt-4"><PaidReport /></TabsContent>
        <TabsContent value="costcenter" className="mt-4"><CostCenterDashboard /></TabsContent>
        <TabsContent value="monthly" className="mt-4"><MonthlyFlowChart /></TabsContent>
        <TabsContent value="suppliers" className="mt-4"><TopSuppliersChart /></TabsContent>
        <TabsContent value="dre" className="mt-4"><DREReport /></TabsContent>
        <TabsContent value="aging" className="mt-4"><AgingReport /></TabsContent>
      </Tabs>
    </div>
  );
};

export default Relatorios;
