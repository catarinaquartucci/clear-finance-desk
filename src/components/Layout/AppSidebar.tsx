import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "@/components/Brand/Logo";
import {
  LayoutDashboard,
  Database,
  Receipt,
  HandCoins,
  Scale,
  Barcode,
  FileText,
  FileSpreadsheet,
  Wallet,
  Calculator,
  BarChart3,
  Target,
  Award,
  PieChart,
  FileBarChart,
  Bot,
  FlaskConical,
  ScanLine,
  CheckCircle,
  Users,
  Monitor,
  Zap,
  Settings,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

const operacionalItems = [
  { icon: Database, label: "Cadastros", path: "/financeiro/cadastros" },
  { icon: Receipt, label: "Contas a Pagar", path: "/financeiro/contas-pagar" },
  { icon: HandCoins, label: "Contas a Receber", path: "/financeiro/contas-receber" },
  { icon: Scale, label: "Conciliação", path: "/financeiro/conciliacao" },
  { icon: Barcode, label: "Boletos", path: "/financeiro/boletos" },
];

const planejamentoItems = [
  { icon: FileSpreadsheet, label: "Planejamento", path: "/financeiro/planejamento" },
  { icon: Wallet, label: "Fluxo de Caixa", path: "/financeiro/fluxo-caixa" },
  { icon: Calculator, label: "Impostos", path: "/financeiro/impostos" },
];

const analiseItems = [
  { icon: BarChart3, label: "Análise Financeira", path: "/financeiro/analise-financeira" },
  { icon: Target, label: "Metas de Vendas", path: "/financeiro/metas-vendas" },
  { icon: Award, label: "Bônus", path: "/financeiro/bonus" },
  { icon: PieChart, label: "Distribuição", path: "/financeiro/distribuicao" },
  { icon: FileBarChart, label: "Relatórios", path: "/financeiro/relatorios" },
];

const iaItems = [
  { icon: Bot, label: "CFO Digital", path: "/financeiro/cfo-digital" },
  { icon: FlaskConical, label: "Simulador", path: "/financeiro/simulador" },
  { icon: ScanLine, label: "Scanner OCR", path: "/financeiro/scanner" },
];

const adminItems = [
  { icon: CheckCircle, label: "Aprovações", path: "/admin/aprovacoes" },
  { icon: Users, label: "Colaboradores", path: "/admin/colaboradores" },
  { icon: Monitor, label: "Equipamentos", path: "/admin/equipamentos" },
  { icon: Zap, label: "Automações", path: "/admin/automacoes" },
  { icon: Settings, label: "Configurações", path: "/admin/configuracoes" },
];

export const AppSidebar = () => {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { isAdmin, hasAdminViewOnly } = useAuth();

  const isActive = (path: string) => location.pathname === path;
  const showAdmin = isAdmin || hasAdminViewOnly;

  const renderGroup = (
    label: string,
    items: { icon: React.ElementType; label: string; path: string }[]
  ) => (
    <SidebarGroup key={label}>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <SidebarMenuItem key={item.path}>
                <SidebarMenuButton asChild isActive={active}>
                  <Link to={item.path}>
                    <Icon className="h-4 w-4" />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <Link to="/dashboard" className="flex items-center gap-3">
          <Logo size="sm" />
          {!collapsed && (
            <span className="text-sm font-medium text-muted-foreground tracking-wide">
              Central Financeira
            </span>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {/* Dashboard */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/dashboard")}>
                  <Link to="/dashboard">
                    <LayoutDashboard className="h-4 w-4" />
                    {!collapsed && <span>Dashboard</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {renderGroup("Operacional", operacionalItems)}
        {renderGroup("Planejamento", planejamentoItems)}
        {renderGroup("Análise", analiseItems)}
        {renderGroup("IA & Automação", iaItems)}
        {showAdmin && renderGroup("Admin", adminItems)}
      </SidebarContent>
    </Sidebar>
  );
};
