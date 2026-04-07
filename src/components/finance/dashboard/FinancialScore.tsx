import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface FinancialScoreProps {
  totalRevenue: number;
  totalExpense: number;
  previousRevenue: number;
  previousExpense: number;
}

export const FinancialScore = ({
  totalRevenue,
  totalExpense,
  previousRevenue,
  previousExpense,
}: FinancialScoreProps) => {
  const [animatedScore, setAnimatedScore] = useState(0);

  const { score, details } = useMemo(() => {
    // Margin score (0-40): current profit margin
    const margin = totalRevenue > 0 ? ((totalRevenue - totalExpense) / totalRevenue) * 100 : 0;
    const marginScore = Math.min(40, Math.max(0, margin * 2));

    // Growth score (0-30): revenue growth vs previous period
    const growth = previousRevenue > 0
      ? ((totalRevenue - previousRevenue) / previousRevenue) * 100
      : totalRevenue > 0 ? 100 : 0;
    const growthScore = Math.min(30, Math.max(0, (growth + 20) * 0.75));

    // Expense control score (0-30): expense reduction or stability
    const expenseChange = previousExpense > 0
      ? ((totalExpense - previousExpense) / previousExpense) * 100
      : 0;
    const expenseScore = Math.min(30, Math.max(0, (20 - expenseChange) * 1.5));

    const total = Math.round(Math.min(100, Math.max(0, marginScore + growthScore + expenseScore)));

    return {
      score: total,
      details: {
        margin: Math.round(margin * 10) / 10,
        growth: Math.round(growth * 10) / 10,
        expenseChange: Math.round(expenseChange * 10) / 10,
        marginScore: Math.round(marginScore),
        growthScore: Math.round(growthScore),
        expenseScore: Math.round(expenseScore),
      },
    };
  }, [totalRevenue, totalExpense, previousRevenue, previousExpense]);

  useEffect(() => {
    let frame: number;
    const duration = 1200;
    const start = performance.now();

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(eased * score));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  const getColor = (s: number) => {
    if (s >= 75) return "hsl(var(--chart-2))";
    if (s >= 50) return "hsl(var(--chart-4))";
    if (s >= 25) return "hsl(var(--chart-3))";
    return "hsl(var(--destructive))";
  };

  const getLabel = (s: number) => {
    if (s >= 75) return "Excelente";
    if (s >= 50) return "Bom";
    if (s >= 25) return "Atenção";
    return "Crítico";
  };

  const color = getColor(animatedScore);
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  const GrowthIcon = details.growth > 0 ? TrendingUp : details.growth < 0 ? TrendingDown : Minus;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          Score Financeiro
          <Tooltip>
            <TooltipTrigger>
              <Info className="h-3.5 w-3.5 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs text-xs">
              <p>Calculado com base em:</p>
              <ul className="mt-1 space-y-0.5">
                <li>• Margem de lucro ({details.marginScore}/40 pts)</li>
                <li>• Crescimento de receita ({details.growthScore}/30 pts)</li>
                <li>• Controle de despesas ({details.expenseScore}/30 pts)</li>
              </ul>
            </TooltipContent>
          </Tooltip>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-3">
        <div className="relative w-36 h-36">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
            <circle
              cx="70" cy="70" r={radius}
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="10"
            />
            <circle
              cx="70" cy="70" r={radius}
              fill="none"
              stroke={color}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-300"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold" style={{ color }}>{animatedScore}</span>
            <span className="text-xs text-muted-foreground">{getLabel(animatedScore)}</span>
          </div>
        </div>

        <div className="w-full grid grid-cols-3 gap-2 text-center text-xs">
          <div>
            <p className="text-muted-foreground">Margem</p>
            <p className="font-medium">{details.margin}%</p>
          </div>
          <div>
            <p className="text-muted-foreground">Crescimento</p>
            <p className="font-medium flex items-center justify-center gap-0.5">
              <GrowthIcon className="h-3 w-3" />
              {details.growth}%
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Despesas</p>
            <p className="font-medium">{details.expenseChange > 0 ? "+" : ""}{details.expenseChange}%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
