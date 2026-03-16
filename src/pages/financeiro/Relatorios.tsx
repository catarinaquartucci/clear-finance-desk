import { FileBarChart, LayoutDashboard, ArrowDownCircle, ArrowUpCircle, CheckCircle2, PieChart, BarChart3 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PayablesReport } from "@/components/finance/reports/PayablesReport";
import { ReceivablesReport } from "@/components/finance/reports/ReceivablesReport";
import { PaidReport } from "@/components/finance/reports/PaidReport";
import { CostCenterDashboard } from "@/components/finance/reports/CostCenterDashboard";
import { MonthlyFlowChart } from "@/components/finance/reports/MonthlyFlowChart";
import { ExecutiveSummary } from "@/components/finance/reports/ExecutiveSummary";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

const tabs = [
  { value: "summary", label: "Resumo Executivo", icon: LayoutDashboard },
  { value: "payables", label: "Contas a Pagar", icon: ArrowDownCircle },
  { value: "receivables", label: "Contas a Receber", icon: ArrowUpCircle },
  { value: "paid", label: "Contas Pagas", icon: CheckCircle2 },
  { value: "costcenter", label: "Centros de Custo", icon: PieChart },
  { value: "monthly", label: "Fluxo Mensal", icon: BarChart3 },
];

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
            {tabs.map(tab => (
              <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5">
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <TabsContent value="summary" className="mt-4"><ExecutiveSummary /></TabsContent>
        <TabsContent value="payables" className="mt-4"><PayablesReport /></TabsContent>
        <TabsContent value="receivables" className="mt-4"><ReceivablesReport /></TabsContent>
        <TabsContent value="paid" className="mt-4"><PaidReport /></TabsContent>
        <TabsContent value="costcenter" className="mt-4"><CostCenterDashboard /></TabsContent>
        <TabsContent value="monthly" className="mt-4"><MonthlyFlowChart /></TabsContent>
      </Tabs>
    </div>
  );
};

export default Relatorios;
