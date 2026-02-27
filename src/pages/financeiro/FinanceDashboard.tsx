import { useState } from "react";
import { FinancialKPICards } from "@/components/finance/analysis/FinancialKPICards";
import { RevenueExpenseChart } from "@/components/finance/dashboard/RevenueExpenseChart";
import { CostCenterPieChart } from "@/components/finance/dashboard/CostCenterPieChart";
import { OverdueAlertCards } from "@/components/finance/dashboard/OverdueAlertCards";
import { DashboardRecentItems } from "@/components/finance/dashboard/DashboardRecentItems";
import { CompanyFilter } from "@/components/finance/CompanyFilter";
import { useDashboardFinance } from "@/hooks/useDashboardFinance";

const FinanceDashboard = () => {
  const [companyId, setCompanyId] = useState("all");
  const { kpis, monthlyData, costCenterData, recentItems, isLoading } = useDashboardFinance(companyId);

  const chartData = monthlyData.map((m) => ({
    month: m.month,
    revenue: m.revenue,
    expenses: m.expenses,
    taxes: 0,
    netMargin: m.revenue - m.expenses,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Financeiro</h1>
          <p className="text-muted-foreground text-sm">Visão geral do ano {new Date().getFullYear()}</p>
        </div>
        <CompanyFilter value={companyId} onChange={setCompanyId} />
      </div>

      <FinancialKPICards data={kpis} isLoading={isLoading} />

      <OverdueAlertCards
        overduePayables={kpis.overduePayables}
        overdueReceivables={kpis.overdueReceivables}
        openPayables={kpis.openPayables}
        openReceivables={kpis.openReceivables}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueExpenseChart data={chartData} />
        <CostCenterPieChart data={costCenterData} />
      </div>

      <DashboardRecentItems items={recentItems} />
    </div>
  );
};

export default FinanceDashboard;
