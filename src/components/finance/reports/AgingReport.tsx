import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useAgingReport, AgingBucket } from "@/hooks/useFinancialReports";
import { cn } from "@/lib/utils";

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const BUCKET_LABELS: Record<AgingBucket, string> = {
  current: "A vencer",
  "1-30": "1-30 dias",
  "31-60": "31-60 dias",
  "61-90": "61-90 dias",
  "90+": "90+ dias",
};

const BUCKET_COLORS: Record<AgingBucket, string> = {
  current: "bg-green-500/10 text-green-700 dark:text-green-400",
  "1-30": "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
  "31-60": "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  "61-90": "bg-red-500/10 text-red-700 dark:text-red-400",
  "90+": "bg-red-700/10 text-red-800 dark:text-red-300",
};

export const AgingReport = () => {
  const { rows, summary, isLoading } = useAgingReport();
  const [tab, setTab] = useState<"all" | "payable" | "receivable">("all");

  const filtered = tab === "all" ? rows : rows.filter((r) => r.type === tab);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Aging Report</CardTitle>
        <CardDescription>Títulos por faixa de vencimento</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary buckets */}
        <div className="grid grid-cols-5 gap-2">
          {(Object.keys(BUCKET_LABELS) as AgingBucket[]).map((bucket) => {
            const s = summary[bucket];
            const total = s.payable + s.receivable;
            return (
              <div key={bucket} className={cn("rounded-lg p-3 text-center", BUCKET_COLORS[bucket])}>
                <p className="text-xs font-medium">{BUCKET_LABELS[bucket]}</p>
                <p className="text-sm font-bold mt-1">{fmt(total)}</p>
              </div>
            );
          })}
        </div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="grid w-full max-w-sm grid-cols-3">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="payable">A Pagar</TabsTrigger>
            <TabsTrigger value="receivable">A Receber</TabsTrigger>
          </TabsList>

          <TabsContent value={tab} className="mt-3">
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum título em aberto</p>
            ) : (
              <div className="max-h-[400px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Entidade</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Faixa</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="max-w-[200px] truncate">{row.description}</TableCell>
                        <TableCell>{row.entity_name || "—"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {row.type === "payable" ? "Pagar" : "Receber"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{fmt(row.amount)}</TableCell>
                        <TableCell className="tabular-nums">
                          {new Date(row.due_date + "T00:00:00").toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell>
                          <span className={cn("text-xs font-medium px-2 py-0.5 rounded", BUCKET_COLORS[row.bucket])}>
                            {BUCKET_LABELS[row.bucket]}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
