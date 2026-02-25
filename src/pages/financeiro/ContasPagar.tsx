import { Receipt } from "lucide-react";
import { PayablesList } from "@/components/finance/payables/PayablesList";

const ContasPagar = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Receipt className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contas a Pagar</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie seus títulos, vencimentos e pagamentos
          </p>
        </div>
      </div>

      <PayablesList />
    </div>
  );
};

export default ContasPagar;
