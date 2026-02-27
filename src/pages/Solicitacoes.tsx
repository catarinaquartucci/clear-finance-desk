import { Header } from "@/components/Layout/Header";
import { Navigation } from "@/components/Layout/Navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReembolsoForm } from "@/components/Forms/ReembolsoForm";

import { MaterialForm } from "@/components/Forms/MaterialForm";
import { MyReembolsosList } from "@/components/Dashboard/MyReembolsosList";

import { MyMateriaisList } from "@/components/Dashboard/MyMateriaisList";
import { useAppPreferences } from "@/contexts/AppPreferencesContext";
import { DollarSign, Package, List } from "lucide-react";

const Solicitacoes = () => {
  const { solicitacoesTab: activeTab, setSolicitacoesTab: setActiveTab } = useAppPreferences();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navigation />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold mb-2 text-foreground">Solicitações Financeiras</h2>
          <p className="text-muted-foreground">
            Preencha o formulário adequado para fazer sua solicitação
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-3 bg-card-dark border border-subtle">
            <TabsTrigger value="reembolso" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <DollarSign className="w-4 h-4" />
              Reembolso
            </TabsTrigger>
            <TabsTrigger value="materiais" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Package className="w-4 h-4" />
              Materiais
            </TabsTrigger>
            <TabsTrigger value="minhas" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <List className="w-4 h-4" />
              Minhas Solicitações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reembolso" className="space-y-4">
            <ReembolsoForm />
          </TabsContent>

          <TabsContent value="materiais" className="space-y-4">
            <MaterialForm />
          </TabsContent>

          <TabsContent value="minhas" className="space-y-4">
            <div className="space-y-6">
              <MyReembolsosList />
              <MyMateriaisList />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Solicitacoes;