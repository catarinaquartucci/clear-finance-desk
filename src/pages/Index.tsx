import { Header } from "@/components/Layout/Header";
import { Navigation } from "@/components/Layout/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useFinanceDashboard } from "@/hooks/useFinanceDashboard";
import { ExpenseBreakdownPie } from "@/components/finance/analysis/ExpenseBreakdownPie";
import { Wallet, TrendingUp, TrendingDown, Target, AlertTriangle, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const formatCurrencyCompact = (v: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v);

const Index = () => {
  const { data, isLoading } = useFinanceDashboard();

  const mesAtual = format(new Date(), "MMMM 'de' yyyy", { locale: ptBR });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navigation />

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Hero */}
        <section className="gradient-cyan text-white rounded-2xl p-8 shadow-lg shadow-primary/20">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-bold mb-2">Painel Financeiro</h1>
            <p className="text-white/80 text-lg capitalize">{mesAtual}</p>
          </div>
        </section>

        {/* KPI Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            icon={Wallet}
            label="Saldo Atual"
            value={data?.saldoAtual}
            isLoading={isLoading}
            colorClass="text-primary"
          />
          <KPICard
            icon={TrendingUp}
            label="Entradas do Mês"
            value={data?.entradasMes}
            isLoading={isLoading}
            colorClass="text-neon-green"
          />
          <KPICard
            icon={TrendingDown}
            label="Saídas do Mês"
            value={data?.saidasMes}
            isLoading={isLoading}
            colorClass="text-destructive"
          />
          <KPICard
            icon={Target}
            label="Projeção 30 dias"
            value={data?.projecaoCaixa}
            isLoading={isLoading}
            colorClass={
              (data?.projecaoCaixa ?? 0) >= 0 ? "text-neon-green" : "text-destructive"
            }
          />
        </section>

        {/* Middle: Alerts + Pie */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Payable Alerts */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange" />
                Contas a Pagar — Atenção
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/financeiro/contas-pagar" className="flex items-center gap-1 text-xs">
                  Ver todas <ExternalLink className="h-3 w-3" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : !data?.payableAlerts?.length ? (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  Nenhuma conta vencida ou próxima do vencimento 🎉
                </p>
              ) : (
                <>
                  <div className="max-h-[280px] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs text-muted-foreground border-b">
                          <th className="text-left py-2 font-medium">Descrição</th>
                          <th className="text-right py-2 font-medium">Valor</th>
                          <th className="text-right py-2 font-medium">Vencimento</th>
                          <th className="text-right py-2 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.payableAlerts.map(p => (
                          <tr key={p.id} className="border-b border-border/50 last:border-0">
                            <td className="py-2 pr-2 max-w-[180px] truncate" title={p.description}>
                              {p.supplier_name || p.description}
                            </td>
                            <td className="py-2 text-right font-medium whitespace-nowrap">
                              {formatCurrencyCompact(p.amount)}
                            </td>
                            <td className="py-2 text-right text-xs whitespace-nowrap">
                              {format(parseISO(p.due_date), "dd/MM")}
                            </td>
                            <td className="py-2 text-right">
                              <Badge
                                variant={p.status === "overdue" ? "destructive" : "outline"}
                                className="text-[10px] px-1.5"
                              >
                                {p.status === "overdue" ? "Vencido" : "Próximo"}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex justify-between mt-4 pt-3 border-t text-xs">
                    <span className="text-destructive font-semibold">
                      Vencido: {formatCurrency(data.totalVencido)}
                    </span>
                    <span className="text-orange font-semibold">
                      A vencer: {formatCurrency(data.totalAVencer)}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Expense Composition */}
          <ExpenseBreakdownPie
            data={data?.expenseComposition || []}
            title={`Despesas por Tipo — ${format(new Date(), "MMM/yyyy", { locale: ptBR })}`}
          />
        </section>
      </main>
    </div>
  );
};

interface KPICardProps {
  icon: React.ElementType;
  label: string;
  value?: number;
  isLoading: boolean;
  colorClass: string;
}

const KPICard = ({ icon: Icon, label, value, isLoading, colorClass }: KPICardProps) => (
  <Card className="p-6">
    <div className="flex items-center gap-3 mb-3">
      <div className="p-2 rounded-lg bg-muted">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <span className="text-sm text-muted-foreground font-medium uppercase tracking-wide">
        {label}
      </span>
    </div>
    {isLoading ? (
      <Skeleton className="h-9 w-32" />
    ) : (
      <p className={`text-2xl font-bold ${colorClass}`}>
        {formatCurrency(value ?? 0)}
      </p>
    )}
  </Card>
);

export default Index;
