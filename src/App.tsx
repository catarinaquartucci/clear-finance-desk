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
import { AppLayout } from "./components/Layout/AppLayout";
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
              <BirthdayPopup />
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <Suspense fallback={<Loading />}>
                    <Routes>
                      <Route path="/" element={<Navigate to="/dashboard" replace />} />
                      <Route path="/auth" element={<Auth />} />
                      <Route path="/regras" element={<Regras />} />

                      {/* All protected routes inside AppLayout */}
                      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                        <Route path="/dashboard" element={<Index />} />
                        <Route path="/solicitacoes" element={<Solicitacoes />} />
                        <Route path="/notas-fiscais" element={<NotasFiscais />} />

                        {/* Finance routes */}
                        <Route path="/financeiro" element={<Navigate to="/financeiro/cadastros" replace />} />
                        <Route path="/financeiro/cadastros" element={<FinanceGuard><Cadastros /></FinanceGuard>} />
                        <Route path="/financeiro/contas-pagar" element={<FinanceGuard><ContasPagar /></FinanceGuard>} />
                        <Route path="/financeiro/contas-receber" element={<FinanceGuard><ContasReceber /></FinanceGuard>} />
                        <Route path="/financeiro/conciliacao" element={<FinanceGuard><Conciliacao /></FinanceGuard>} />
                        <Route path="/financeiro/planejamento" element={<FinanceGuard><Planejamento /></FinanceGuard>} />
                        <Route path="/financeiro/fluxo-caixa" element={<FinanceGuard><FluxoCaixa /></FinanceGuard>} />
                        <Route path="/financeiro/analise-financeira" element={<FinanceGuard><AnaliseFinanceira /></FinanceGuard>} />
                        <Route path="/financeiro/impostos" element={<FinanceGuard><Impostos /></FinanceGuard>} />
                        <Route path="/financeiro/metas-vendas" element={<FinanceGuard><MetasVendas /></FinanceGuard>} />
                        <Route path="/financeiro/bonus" element={<FinanceGuard><Bonus /></FinanceGuard>} />
                        <Route path="/financeiro/distribuicao" element={<FinanceGuard><Distribuicao /></FinanceGuard>} />
                        <Route path="/financeiro/relatorios" element={<FinanceGuard><Relatorios /></FinanceGuard>} />
                        <Route path="/financeiro/emissao-nf" element={<FinanceGuard><EmissaoNF /></FinanceGuard>} />
                        <Route path="/financeiro/boletos" element={<FinanceGuard><BoletosPage /></FinanceGuard>} />

                        {/* Admin routes */}
                        <Route path="/admin" element={<Navigate to="/admin/aprovacoes" replace />} />
                        <Route path="/admin/aprovacoes" element={<AdminGuard><AdminDashboard /></AdminGuard>} />
                        <Route path="/admin/colaboradores" element={<AdminGuard><AdminColaboradores /></AdminGuard>} />
                        <Route path="/admin/equipamentos" element={<AdminGuard><AdminEquipamentos /></AdminGuard>} />
                        <Route path="/admin/automacoes" element={<AdminGuard><AdminAutomacoes /></AdminGuard>} />
                        <Route path="/admin/configuracoes" element={<AdminGuard><AdminConfiguracoes /></AdminGuard>} />
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
