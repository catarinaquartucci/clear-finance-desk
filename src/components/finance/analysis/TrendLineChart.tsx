import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart,
} from "recharts";

interface TrendData {
  label: string;
  value: number;
  target?: number;
}

interface TrendLineChartProps {
  data: TrendData[];
  title: string;
  dataKey?: string;
  color?: string;
  format?: 'currency' | 'percent';
  showTarget?: boolean;
  targetValue?: number;
  showArea?: boolean;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    notation: 'compact',
    compactDisplay: 'short',
  }).format(value);

const formatPercent = (value: number) => `${value.toFixed(1)}%`;

export const TrendLineChart = ({ 
  data, 
  title, 
  color = 'hsl(var(--primary))',
  format = 'currency',
  showTarget = false,
  targetValue,
  showArea = false,
}: TrendLineChartProps) => {
  const formatter = format === 'currency' ? formatCurrency : formatPercent;
  const yAxisFormatter = format === 'currency' 
    ? (v: number) => formatCurrency(v)
    : (v: number) => `${v.toFixed(0)}%`;

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-48">
          <p className="text-muted-foreground text-sm">Sem dados disponíveis</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data}>
              <XAxis 
                dataKey="label" 
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={yAxisFormatter}
              />
              <Tooltip 
                formatter={(value: number) => formatter(value)}
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--popover))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                labelStyle={{ fontWeight: 'bold' }}
              />
              {showArea && (
                <Area
                  type="monotone"
                  dataKey="value"
                  fill={color}
                  fillOpacity={0.1}
                  stroke="none"
                />
              )}
              <Line
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                dot={{ r: 4, fill: color }}
                activeDot={{ r: 6 }}
              />
              {showTarget && targetValue && (
                <ReferenceLine 
                  y={targetValue} 
                  stroke="hsl(var(--muted-foreground))" 
                  strokeDasharray="5 5"
                  label={{ 
                    value: `Meta: ${formatter(targetValue)}`, 
                    position: 'insideTopRight',
                    fontSize: 10,
                    fill: 'hsl(var(--muted-foreground))'
                  }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
