import { useState, useCallback } from "react";
import { ScanLine, Upload, Loader2, FileText, Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ExtractedData {
  document_type: string;
  amount?: number;
  due_date?: string;
  issue_date?: string;
  issuer_name?: string;
  issuer_document?: string;
  payer_name?: string;
  payer_document?: string;
  barcode?: string;
  description?: string;
  invoice_number?: string;
  confidence?: number;
}

const TYPE_LABELS: Record<string, string> = {
  boleto: "Boleto",
  nota_fiscal: "Nota Fiscal",
  recibo: "Recibo",
  outro: "Outro",
};

const ScannerDocumentos = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [extracted, setExtracted] = useState<ExtractedData | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      toast.error("Envie uma imagem ou PDF.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Arquivo muito grande (máx 10MB).");
      return;
    }

    setExtracted(null);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      setPreview(dataUrl);

      const base64 = dataUrl.split(",")[1];
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast.error("Autenticação necessária."); setIsProcessing(false); return; }

      try {
        const resp = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ocr-document`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ image_base64: base64, mime_type: file.type }),
          }
        );

        if (!resp.ok) {
          const err = await resp.json().catch(() => ({ error: "Erro" }));
          throw new Error(err.error || `Erro ${resp.status}`);
        }

        const { data } = await resp.json();
        setExtracted(data);
        toast.success("Documento analisado com sucesso!");
      } catch (e: any) {
        toast.error(e.message || "Erro ao processar documento.");
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const createPayable = async () => {
    if (!extracted) return;
    setIsCreating(true);
    try {
      const { error } = await supabase.from("payables").insert({
        description: extracted.description || extracted.issuer_name || "Documento escaneado",
        amount: extracted.amount || 0,
        due_date: extracted.due_date || new Date().toISOString().split("T")[0],
        status: "pending",
      });
      if (error) throw error;
      toast.success("Conta a pagar criada com sucesso!");
      setExtracted(null);
      setPreview(null);
    } catch (e: any) {
      toast.error("Erro ao criar lançamento: " + e.message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <ScanLine className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Scanner de Documentos</h1>
          <p className="text-sm text-muted-foreground">Upload de boletos, notas fiscais e recibos — IA extrai os dados automaticamente</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload area */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Upload do Documento</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              onDrop={onDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => document.getElementById("file-input")?.click()}
            >
              {isProcessing ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Analisando documento com IA...</p>
                </div>
              ) : preview ? (
                <img src={preview} alt="Preview" className="max-h-64 mx-auto rounded" />
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <Upload className="h-10 w-10 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Arraste um arquivo ou clique para selecionar</p>
                    <p className="text-sm text-muted-foreground mt-1">Imagens (JPG, PNG) ou PDF • Máx 10MB</p>
                  </div>
                </div>
              )}
              <input
                id="file-input"
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Extracted data */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Dados Extraídos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {extracted ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant={extracted.confidence && extracted.confidence >= 80 ? "default" : "secondary"}>
                    {TYPE_LABELS[extracted.document_type] || extracted.document_type}
                  </Badge>
                  {extracted.confidence && (
                    <Badge variant="outline" className="text-xs">
                      {extracted.confidence}% confiança
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {extracted.amount != null && (
                    <div><Label className="text-xs text-muted-foreground">Valor</Label><Input value={`R$ ${extracted.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} readOnly /></div>
                  )}
                  {extracted.due_date && (
                    <div><Label className="text-xs text-muted-foreground">Vencimento</Label><Input value={extracted.due_date} readOnly /></div>
                  )}
                  {extracted.issuer_name && (
                    <div><Label className="text-xs text-muted-foreground">Emitente</Label><Input value={extracted.issuer_name} readOnly /></div>
                  )}
                  {extracted.issuer_document && (
                    <div><Label className="text-xs text-muted-foreground">CNPJ/CPF Emitente</Label><Input value={extracted.issuer_document} readOnly /></div>
                  )}
                  {extracted.description && (
                    <div className="sm:col-span-2"><Label className="text-xs text-muted-foreground">Descrição</Label><Input value={extracted.description} readOnly /></div>
                  )}
                  {extracted.barcode && (
                    <div className="sm:col-span-2"><Label className="text-xs text-muted-foreground">Código de Barras</Label><Input value={extracted.barcode} readOnly className="font-mono text-xs" /></div>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button onClick={createPayable} disabled={isCreating} className="flex-1">
                    {isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                    Criar Conta a Pagar
                  </Button>
                  <Button variant="outline" onClick={() => { setExtracted(null); setPreview(null); }}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                <ScanLine className="h-8 w-8 mb-2" />
                <p className="text-sm">Envie um documento para extrair os dados</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ScannerDocumentos;
