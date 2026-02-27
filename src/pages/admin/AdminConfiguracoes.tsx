import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Users, Building2, Target, Settings } from "lucide-react";
import { RegrasEditor } from "@/components/admin/configuracoes/RegrasEditor";
import { UsuariosSistema } from "@/components/admin/configuracoes/UsuariosSistema";
import { EmpresasGrupo } from "@/components/admin/configuracoes/EmpresasGrupo";
import { MetasGerais } from "@/components/admin/configuracoes/MetasGerais";
import { PreferenciasGerais } from "@/components/admin/configuracoes/PreferenciasGerais";

const AdminConfiguracoes = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configurações do Sistema</h1>
        <p className="text-muted-foreground">
          Gerencie regras, usuários, empresas e preferências do sistema.
        </p>
      </div>

      <Tabs defaultValue="regras" className="space-y-6">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="regras" className="gap-2">
            <FileText className="w-4 h-4" />
            Regras e Métricas
          </TabsTrigger>
          <TabsTrigger value="usuarios" className="gap-2">
            <Users className="w-4 h-4" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="empresas" className="gap-2">
            <Building2 className="w-4 h-4" />
            Empresas do Grupo
          </TabsTrigger>
          <TabsTrigger value="metas" className="gap-2">
            <Target className="w-4 h-4" />
            Metas Gerais
          </TabsTrigger>
          <TabsTrigger value="preferencias" className="gap-2">
            <Settings className="w-4 h-4" />
            Preferências
          </TabsTrigger>
        </TabsList>

        <TabsContent value="regras">
          <RegrasEditor />
        </TabsContent>
        <TabsContent value="usuarios">
          <UsuariosSistema />
        </TabsContent>
        <TabsContent value="empresas">
          <EmpresasGrupo />
        </TabsContent>
        <TabsContent value="metas">
          <MetasGerais />
        </TabsContent>
        <TabsContent value="preferencias">
          <PreferenciasGerais />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminConfiguracoes;
