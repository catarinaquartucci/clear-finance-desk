import { useMemo } from "react";
import { format, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart3 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMonthlyPlanning } from "@/hooks/useMonthlyPlanning";
import { useMonthlyTargets } from "@/hooks/useMonthlyTargets";
import { useFinancialAnalysis } from "@/hooks/useFinancialAnalysis";
import { useAppPreferences } from "@/contexts/AppPreferencesContext";

// Analysis Components
import { FinancialKPICards } from "@/components/finance/analysis/FinancialKPICards";
import { RevenueBreakdownPie } from "@/components/finance/analysis/RevenueBreakdownPie";
import { ExpenseBreakdownPie } from "@/components/finance/analysis/ExpenseBreakdownPie";
import { PeriodComparisonCards } from "@/components/finance/analysis/PeriodComparisonCards";
import { VariationTable } from "@/components/finance/analysis/VariationTable";
import { TrendLineChart } from "@/components/finance/analysis/TrendLineChart";
import { MovingAveragesCard } from "@/components/finance/analysis/MovingAveragesCard";
import { ScenarioProjectionChart } from "@/components/finance/analysis/ScenarioProjectionChart";
import { BreakevenCalculator } from "@/components/finance/analysis/BreakevenCalculator";

// Existing chart component
import { MonthlyComparisonChart } from "@/components/finance/monthly-analysis/MonthlyComparisonChart";
import { UnderConstructionBanner } from "@/components/ui/under-construction-banner";

const AnaliseFinanceira = () => {
  const currentYear = new Date().getFullYear();
  const {
    analysisYear: selectedYear,
    setAnalysisYear: setSelectedYear,
    analysisComparisonType: comparisonType,
    setAnalysisComparisonType: setComparisonType,
  } = useAppPreferences();

  const { planningData, isLoading: planningLoading } = useMonthlyPlanning();
  const { targets, getTargetByMonth } = useMonthlyTargets();
  
  const {
    yearData,
    yearKPIs,
    movingAverages,
    revenueComposition,
    expenseComposition,
    scenarioProjections,
    comparePeriods,
    calculateBreakeven,
  } = useFinancialAnalysis(planningData, targets, selectedYear);

  // Year options
  const yearOptions = useMemo(() => {
    const options = [];
    for (let year = currentYear; year >= currentYear - 3; year--) {
      options.push({ value: year, label: year.toString() });
    }
    return options;
  }, [currentYear]);

  // Comparison data
  const comparisonData = useMemo(() => {
    const today = new Date();
    const currentMonthStr = format(today, 'yyyy-MM-01');
    
    if (comparisonType === 'mom') {
      const prevMonthStr = format(subMonths(today, 1), 'yyyy-MM-01');
      return comparePeriods([currentMonthStr], [prevMonthStr]);
    } else {
      const sameMonthLastYear = format(new Date(today.getFullYear() - 1, today.getMonth(), 1), 'yyyy-MM-01');
      return comparePeriods([currentMonthStr], [sameMonthLastYear]);
    }
  }, [comparePeriods, comparisonType]);

  // Data for comparison chart (last 6 months)
  const comparisonChartData = useMemo(() => {
    if (!planningData) return [];
    
    const today = new Date();
    const data = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(today, i);
      const monthStr = format(date, 'yyyy-MM-01');
      const monthLabel = format(date, 'MMM/yy', { locale: ptBR });
      
      const planning = planningData.find(p => p.month === monthStr);
      const target = getTargetByMonth(monthStr);
      
      const revenue = (Number(planning?.revenue) || 0) + 
                     (Number(planning?.planned_revenue) || 0) +
                     (Number(planning?.other_revenue) || 0) + 
                     (Number(planning?.forecast_revenue) || 0);
      const expense = (Number(planning?.expense) || 0) + 
                     (Number(planning?.planned_expense) || 0) +
                     (Number(planning?.other_expense) || 0) + 
                     (Number(planning?.forecast_expense) || 0) +
                     (Number(planning?.tax) || 0) +
                     (Number(planning?.platform_fee) || 0);
      
      data.push({
        month: monthLabel,
        revenue,
        target: Number(target?.revenue_target) || 0,
        expense,
      });
    }
    
    return data;
  }, [planningData, getTargetByMonth]);

  // Trend data for line charts
  const trendData = useMemo(() => {
    return {
      revenue: yearData.map(d => ({ label: d.label, value: d.revenue })),
      netMargin: yearData.map(d => ({ label: d.label, value: d.netMargin })),
      cashBalance: yearData.map(d => ({ label: d.label, value: d.cashBalance })),
    };
  }, [yearData]);

  // Variation table metrics
  const variationMetrics = useMemo(() => {
    if (!comparisonData) return [];
    
    return [
      {
        label: 'Receita Total',
        current: comparisonData.current.totalRevenue,
        previous: comparisonData.previous.totalRevenue,
        variation: comparisonData.variations.revenue,
        format: 'currency' as const,
      },
      {
        label: 'Despesa Total',
        current: comparisonData.current.totalExpense,
        previous: comparisonData.previous.totalExpense,
        variation: comparisonData.variations.expense,
        format: 'currency' as const,
        inverse: true,
      },
      {
        label: 'Geração de Caixa',
        current: comparisonData.current.cashGeneration,
        previous: comparisonData.previous.cashGeneration,
        variation: comparisonData.variations.cashGeneration,
        format: 'currency' as const,
      },
      {
        label: 'Margem Líquida',
        current: comparisonData.current.netMargin,
        previous: comparisonData.previous.netMargin,
        variation: comparisonData.variations.netMargin,
        format: 'points' as const,
      },
    ];
  }, [comparisonData]);

  if (planningLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <UnderConstructionBanner />
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Análise Financeira</h1>
        </div>
        
        <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {yearOptions.map(option => (
              <SelectItem key={option.value} value={option.value.toString()}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="comparativo">Comparativo</TabsTrigger>
          <TabsTrigger value="evolucao">Evolução</TabsTrigger>
          <TabsTrigger value="projecoes">Projeções</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          <FinancialKPICards data={yearKPIs} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <RevenueBreakdownPie data={revenueComposition} />
            <ExpenseBreakdownPie data={expenseComposition} />
          </div>
          
          <MonthlyComparisonChart 
            data={comparisonChartData} 
            title="📊 Receita vs Meta vs Despesa (últimos 6 meses)"
          />
        </TabsContent>

        {/* Comparativo Tab */}
        <TabsContent value="comparativo" className="space-y-6">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Comparar:</span>
            <Select value={comparisonType} onValueChange={(v) => setComparisonType(v as 'mom' | 'yoy')}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mom">Mês a Mês (MoM)</SelectItem>
                <SelectItem value="yoy">Ano a Ano (YoY)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <PeriodComparisonCards
            currentPeriod={{
              label: comparisonType === 'mom' ? 'Mês Atual' : 'Este Ano',
              metrics: comparisonData.current,
            }}
            previousPeriod={{
              label: comparisonType === 'mom' ? 'Mês Anterior' : 'Ano Anterior',
              metrics: comparisonData.previous,
            }}
            variations={comparisonData.variations}
          />

          <VariationTable
            metrics={variationMetrics}
            currentLabel={comparisonType === 'mom' ? 'Atual' : 'Este Ano'}
            previousLabel={comparisonType === 'mom' ? 'Anterior' : 'Ano Passado'}
          />
        </TabsContent>

        {/* Evolução Tab */}
        <TabsContent value="evolucao" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TrendLineChart 
              data={trendData.revenue}
              title="📈 Evolução da Receita"
              color="hsl(142 76% 36%)"
              format="currency"
              showArea
            />
            <TrendLineChart 
              data={trendData.netMargin}
              title="📊 Evolução da Margem Líquida"
              color="hsl(var(--primary))"
              format="percent"
              showTarget
              targetValue={15}
            />
          </div>

          <TrendLineChart 
            data={trendData.cashBalance}
            title="💰 Evolução do Saldo de Caixa"
            color="hsl(199 89% 48%)"
            format="currency"
            showArea
          />

          <MovingAveragesCard data={movingAverages} />
        </TabsContent>

        {/* Projeções Tab */}
        <TabsContent value="projecoes" className="space-y-6">
          <ScenarioProjectionChart projections={scenarioProjections} />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BreakevenCalculator calculateBreakeven={calculateBreakeven} />
            
            {/* Scenario Summary */}
            <div className="space-y-4">
              {scenarioProjections.map((scenario) => (
                <div 
                  key={scenario.name}
                  className={`p-4 rounded-lg border ${
                    scenario.name === 'Base' ? 'bg-primary/5 border-primary/30' :
                    scenario.name === 'Otimista' ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' :
                    'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{scenario.name}</h4>
                    <span className="text-sm text-muted-foreground">
                      {(scenario.factor * 100).toFixed(0)}% da meta
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Receita Projetada</p>
                      <p className="font-semibold text-green-600">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(scenario.totals.revenue)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Geração de Caixa</p>
                      <p className={`font-semibold ${scenario.totals.cashGeneration >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(scenario.totals.cashGeneration)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Despesa Projetada</p>
                      <p className="font-semibold text-red-600">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(scenario.totals.expense)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Margem Líquida</p>
                      <p className={`font-semibold ${scenario.totals.netMargin >= 0 ? 'text-cyan-600' : 'text-red-600'}`}>
                        {scenario.totals.netMargin.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnaliseFinanceira;
