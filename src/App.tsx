import { lazy, Suspense } from "react";
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
import ErrorBoundary from "./components/ErrorBoundary";
import Auth from "./pages/Auth";
import Regras from "./pages/Regras";
import NotFound from "./pages/NotFound";

// Lazy-loaded pages
const Index = lazy(() => import("./pages/Index"));
const Solicitacoes = lazy(() => import("./pages/Solicitacoes"));
const NotasFiscais = lazy(() => import("./pages/NotasFiscais"));

// Admin pages (lazy)
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminColaboradores = lazy(() => import("./pages/admin/AdminColaboradores"));
const AdminEquipamentos = lazy(() => import("./pages/admin/AdminEquipamentos"));
const AdminAutomacoes = lazy(() => import("./pages/admin/AdminAutomacoes"));
const AdminConfiguracoes = lazy(() => import("./pages/admin/AdminConfiguracoes"));

// Finance pages (lazy)
const Planejamento = lazy(() => import("./pages/financeiro/Planejamento"));
const FluxoCaixa = lazy(() => import("./pages/financeiro/FluxoCaixa"));
const AnaliseFinanceira = lazy(() => import("./pages/financeiro/AnaliseFinanceira"));
const Impostos = lazy(() => import("./pages/financeiro/Impostos"));
const MetasVendas = lazy(() => import("./pages/financeiro/MetasVendas"));
const Bonus = lazy(() => import("./pages/financeiro/Bonus"));
const Distribuicao = lazy(() => import("./pages/financeiro/Distribuicao"));
const Cadastros = lazy(() => import("./pages/financeiro/Cadastros"));
const ContasPagar = lazy(() => import("./pages/financeiro/ContasPagar"));
const ContasReceber = lazy(() => import("./pages/financeiro/ContasReceber"));
const Conciliacao = lazy(() => import("./pages/financeiro/Conciliacao"));
const Relatorios = lazy(() => import("./pages/financeiro/Relatorios"));
const EmissaoNF = lazy(() => import("./pages/financeiro/EmissaoNF"));
const BoletosPage = lazy(() => import("./pages/financeiro/Boletos"));

const queryClient = new QueryClient();

const Loading = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>
);

const App = () => (
  <ErrorBoundary>
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="viver-de-ia-theme">
      <AuthProvider>
        <DuplicateProvider>
          <AppPreferencesProvider>
        <DuplicateProvider>
          <AppPreferencesProvider>
            <BirthdayPopup />
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Suspense fallback={<Loading />}>
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
                    <Route path="configuracoes" element={<AdminConfiguracoes />} />
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
                    <Route path="relatorios" element={<Relatorios />} />
                    <Route path="emissao-nf" element={<EmissaoNF />} />
                    <Route path="boletos" element={<BoletosPage />} />
                  </Route>
                  
                  <Route path="*" element={<NotFound />} />
                </Routes>
                </Suspense>
              </BrowserRouter>
            </TooltipProvider>
          </AppPreferencesProvider>
        </DuplicateProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
