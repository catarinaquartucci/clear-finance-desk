import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./components/theme-provider";
import { AuthProvider } from "./contexts/AuthContext";
import { DuplicateProvider } from "./contexts/DuplicateContext";
import { AppPreferencesProvider } from "./contexts/AppPreferencesContext";
import { ProtectedRoute } from "./components/Auth/ProtectedRoute";
import { FinanceGuard } from "./components/guards/FinanceGuard";
import { AdminGuard } from "./components/guards/AdminGuard";
import { FinanceLayout } from "./components/finance/layout/FinanceLayout";
import { AdminLayout } from "./components/admin/layout/AdminLayout";
import { BirthdayPopup } from "./components/Birthday/BirthdayPopup";
import Index from "./pages/Index";
import Solicitacoes from "./pages/Solicitacoes";
import NotasFiscais from "./pages/NotasFiscais";
import Regras from "./pages/Regras";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminColaboradores from "./pages/admin/AdminColaboradores";
import AdminEquipamentos from "./pages/admin/AdminEquipamentos";
import AdminAutomacoes from "./pages/admin/AdminAutomacoes";

// Finance pages
import Planejamento from "./pages/financeiro/Planejamento";
import FluxoCaixa from "./pages/financeiro/FluxoCaixa";
import AnaliseFinanceira from "./pages/financeiro/AnaliseFinanceira";
import Impostos from "./pages/financeiro/Impostos";
import MetasVendas from "./pages/financeiro/MetasVendas";
import Bonus from "./pages/financeiro/Bonus";
import Distribuicao from "./pages/financeiro/Distribuicao";
import Cadastros from "./pages/financeiro/Cadastros";
import ContasPagar from "./pages/financeiro/ContasPagar";
import ContasReceber from "./pages/financeiro/ContasReceber";
import Conciliacao from "./pages/financeiro/Conciliacao";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark" storageKey="viver-de-ia-theme">
      <AuthProvider>
        <DuplicateProvider>
          <AppPreferencesProvider>
            <BirthdayPopup />
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Regras />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/regras" element={<Regras />} />
                  
                  <Route path="/solicitacoes" element={
                    <ProtectedRoute>
                      <Solicitacoes />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/notas-fiscais" element={
                    <ProtectedRoute>
                      <NotasFiscais />
                    </ProtectedRoute>
                  } />
                  
                  {/* Admin Module Routes */}
                  <Route path="/admin" element={
                    <AdminGuard>
                      <AdminLayout />
                    </AdminGuard>
                  }>
                    <Route index element={<Navigate to="aprovacoes" replace />} />
                    <Route path="aprovacoes" element={<AdminDashboard />} />
                    <Route path="colaboradores" element={<AdminColaboradores />} />
                    <Route path="equipamentos" element={<AdminEquipamentos />} />
                    <Route path="automacoes" element={<AdminAutomacoes />} />
                  </Route>

                  {/* Finance Module Routes */}
                  <Route path="/financeiro" element={
                    <FinanceGuard>
                      <FinanceLayout />
                    </FinanceGuard>
                  }>
                    <Route index element={<Navigate to="cadastros" replace />} />
                    <Route path="cadastros" element={<Cadastros />} />
                    <Route path="contas-pagar" element={<ContasPagar />} />
                    <Route path="contas-receber" element={<ContasReceber />} />
                    <Route path="conciliacao" element={<Conciliacao />} />
                    <Route path="planejamento" element={<Planejamento />} />
                    <Route path="fluxo-caixa" element={<FluxoCaixa />} />
                    <Route path="analise-financeira" element={<AnaliseFinanceira />} />
                    <Route path="impostos" element={<Impostos />} />
                    <Route path="metas-vendas" element={<MetasVendas />} />
                    <Route path="bonus" element={<Bonus />} />
                    <Route path="distribuicao" element={<Distribuicao />} />
                  </Route>
                  
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </AppPreferencesProvider>
        </DuplicateProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
