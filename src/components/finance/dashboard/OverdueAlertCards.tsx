import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, CheckCircle } from "lucide-react";

interface OverdueAlertCardsProps {
  overduePayables: number;
  overdueReceivables: number;
  openPayables: number;
  openReceivables: number;
}

export const OverdueAlertCards = ({
  overduePayables,
  overdueReceivables,
  openPayables,
  openReceivables,
}: OverdueAlertCardsProps) => {
  const items = [
    {
      label: "Contas a Pagar Vencidas",
      value: overduePayables,
      isAlert: overduePayables > 0,
    },
    {
      label: "Contas a Receber Vencidas",
      value: overdueReceivables,
      isAlert: overdueReceivables > 0,
    },
    {
      label: "Contas a Pagar em Dia",
      value: openPayables,
      isAlert: false,
    },
    {
      label: "Contas a Receber em Dia",
      value: openReceivables,
      isAlert: false,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map((item) => (
        <Card
          key={item.label}
          className={item.isAlert ? "border-destructive/50 bg-destructive/5" : "border-border"}
        >
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            {item.isAlert ? (
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
            ) : (
              <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
            )}
            <div>
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className={`text-xl font-bold ${item.isAlert ? "text-destructive" : "text-foreground"}`}>
                {item.value}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
