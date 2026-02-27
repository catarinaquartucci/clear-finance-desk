import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import type { RecentItem } from "@/hooks/useDashboardFinance";

interface DashboardRecentItemsProps {
  items: RecentItem[];
}

const statusLabels: Record<string, string> = {
  open: "Em aberto",
  overdue: "Vencido",
  paid: "Pago",
  received: "Recebido",
  cancelled: "Cancelado",
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export const DashboardRecentItems = ({ items }: DashboardRecentItemsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Últimas Movimentações</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">Nenhuma movimentação encontrada</p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const isReceivable = item.type === "receivable";
              return (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${isReceivable ? "bg-green-100 dark:bg-green-950/30" : "bg-red-100 dark:bg-red-950/30"}`}>
                      {isReceivable ? (
                        <ArrowUpCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <ArrowDownCircle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{item.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(item.due_date), "dd/MM/yyyy", { locale: ptBR })}
                        {item.entity_name && <span> • {item.entity_name}</span>}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <Badge variant={item.status === "overdue" ? "destructive" : "outline"} className="text-xs">
                      {statusLabels[item.status] || item.status}
                    </Badge>
                    <p className={`font-semibold text-sm ${isReceivable ? "text-green-600" : "text-red-600"}`}>
                      {isReceivable ? "+" : "-"}{formatCurrency(item.amount)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
