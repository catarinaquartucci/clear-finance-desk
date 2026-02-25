import { HandCoins } from "lucide-react";
import { ReceivablesList } from "@/components/finance/receivables/ReceivablesList";

const ContasReceber = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <HandCoins className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contas a Receber</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie seus recebíveis, inadimplência e baixas
          </p>
        </div>
      </div>

      <ReceivablesList />
    </div>
  );
};

export default ContasReceber;
