import { FileBarChart } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DREReport } from "@/components/finance/reports/DREReport";
import { AgingReport } from "@/components/finance/reports/AgingReport";
import { SupplierReportTable, CustomerReportTable, CostCenterReportTable } from "@/components/finance/reports/EntityReportTable";

const Relatorios = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <FileBarChart className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Relatórios Financeiros</h1>
          <p className="text-sm text-muted-foreground">
            DRE, aging report e relatórios analíticos
          </p>
        </div>
      </div>

      <Tabs defaultValue="dre">
        <TabsList className="grid w-full max-w-2xl grid-cols-5">
          <TabsTrigger value="dre">DRE</TabsTrigger>
          <TabsTrigger value="aging">Aging</TabsTrigger>
          <TabsTrigger value="supplier">Fornecedores</TabsTrigger>
          <TabsTrigger value="customer">Clientes</TabsTrigger>
          <TabsTrigger value="costcenter">Centros Custo</TabsTrigger>
        </TabsList>

        <TabsContent value="dre" className="mt-4">
          <DREReport />
        </TabsContent>

        <TabsContent value="aging" className="mt-4">
          <AgingReport />
        </TabsContent>

        <TabsContent value="supplier" className="mt-4">
          <SupplierReportTable />
        </TabsContent>

        <TabsContent value="customer" className="mt-4">
          <CustomerReportTable />
        </TabsContent>

        <TabsContent value="costcenter" className="mt-4">
          <CostCenterReportTable />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Relatorios;
