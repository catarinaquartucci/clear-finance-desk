import { FileText } from "lucide-react";
import { InvoicesList } from "@/components/finance/invoices/InvoicesList";

const EmissaoNF = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <FileText className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Emissão de NFS-e</h1>
          <p className="text-sm text-muted-foreground">
            Controle interno de notas fiscais de serviço
          </p>
        </div>
      </div>

      <InvoicesList />
    </div>
  );
};

export default EmissaoNF;
