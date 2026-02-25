import { Scale } from "lucide-react";
import { ReconciliationPanel } from "@/components/finance/reconciliation/ReconciliationPanel";

const Conciliacao = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Scale className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Conciliação Bancária</h1>
          <p className="text-sm text-muted-foreground">
            Importe extratos e concilie com contas a pagar e receber
          </p>
        </div>
      </div>

      <ReconciliationPanel />
    </div>
  );
};

export default Conciliacao;
