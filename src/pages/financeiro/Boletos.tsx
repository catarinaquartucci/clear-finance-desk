import { Barcode } from "lucide-react";
import { BoletosList } from "@/components/finance/boletos/BoletosList";

const Boletos = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Barcode className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Boletos</h1>
          <p className="text-sm text-muted-foreground">
            Controle interno de boletos bancários
          </p>
        </div>
      </div>

      <BoletosList />
    </div>
  );
};

export default Boletos;
