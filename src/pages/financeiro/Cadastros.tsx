import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Users, Landmark, BookOpen, FolderTree } from "lucide-react";
import { SuppliersList } from "@/components/finance/cadastros/SuppliersList";
import { CustomersList } from "@/components/finance/cadastros/CustomersList";
import { BankAccountsList } from "@/components/finance/cadastros/BankAccountsList";
import { ChartOfAccountsList } from "@/components/finance/cadastros/ChartOfAccountsList";
import { CostCentersList } from "@/components/finance/cadastros/CostCentersList";

const Cadastros = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Cadastros</h1>
        <p className="text-muted-foreground mt-1">Gerencie fornecedores, clientes, contas bancárias, plano de contas e centros de custo.</p>
      </div>

      <Tabs defaultValue="suppliers" className="w-full">
        <TabsList className="w-full justify-start flex-wrap h-auto gap-1">
          <TabsTrigger value="suppliers" className="gap-2">
            <Building2 className="w-4 h-4" />Fornecedores
          </TabsTrigger>
          <TabsTrigger value="customers" className="gap-2">
            <Users className="w-4 h-4" />Clientes
          </TabsTrigger>
          <TabsTrigger value="bank_accounts" className="gap-2">
            <Landmark className="w-4 h-4" />Contas Bancárias
          </TabsTrigger>
          <TabsTrigger value="chart_of_accounts" className="gap-2">
            <BookOpen className="w-4 h-4" />Plano de Contas
          </TabsTrigger>
          <TabsTrigger value="cost_centers" className="gap-2">
            <FolderTree className="w-4 h-4" />Centros de Custo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="suppliers" className="mt-4"><SuppliersList /></TabsContent>
        <TabsContent value="customers" className="mt-4"><CustomersList /></TabsContent>
        <TabsContent value="bank_accounts" className="mt-4"><BankAccountsList /></TabsContent>
        <TabsContent value="chart_of_accounts" className="mt-4"><ChartOfAccountsList /></TabsContent>
        <TabsContent value="cost_centers" className="mt-4"><CostCentersList /></TabsContent>
      </Tabs>
    </div>
  );
};

export default Cadastros;
