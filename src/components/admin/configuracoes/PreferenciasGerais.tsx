import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save } from "lucide-react";
import { useSystemSettings } from "@/hooks/useSystemSettings";

export const PreferenciasGerais = () => {
  const { isLoading, getSetting, upsertSetting } = useSystemSettings("preferences");
  const [companyName, setCompanyName] = useState("");
  const [timezone, setTimezone] = useState("America/Sao_Paulo");
  const [currency, setCurrency] = useState("BRL");

  useEffect(() => {
    if (!isLoading) {
      const savedName = getSetting("company_name");
      if (savedName) setCompanyName(savedName);
      const savedTz = getSetting("timezone");
      if (savedTz) setTimezone(savedTz);
      const savedCurrency = getSetting("currency");
      if (savedCurrency) setCurrency(savedCurrency);
    }
  }, [isLoading]);

  const handleSave = () => {
    upsertSetting.mutate({ key: "company_name", value: companyName, category: "preferences" });
    upsertSetting.mutate({ key: "timezone", value: timezone, category: "preferences" });
    upsertSetting.mutate({ key: "currency", value: currency, category: "preferences" });
  };

  if (isLoading) return <div className="text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Preferências Gerais</h3>
          <p className="text-sm text-muted-foreground">Configurações básicas da organização.</p>
        </div>
        <Button onClick={handleSave} disabled={upsertSetting.isPending}>
          <Save className="w-4 h-4 mr-2" />
          Salvar
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div>
            <Label>Nome da Empresa / Organização</Label>
            <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Ex: Viver de IA" />
          </div>
          <div>
            <Label>Fuso Horário</Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="America/Sao_Paulo">Brasília (GMT-3)</SelectItem>
                <SelectItem value="America/Manaus">Manaus (GMT-4)</SelectItem>
                <SelectItem value="America/Belem">Belém (GMT-3)</SelectItem>
                <SelectItem value="America/Fortaleza">Fortaleza (GMT-3)</SelectItem>
                <SelectItem value="America/Cuiaba">Cuiabá (GMT-4)</SelectItem>
                <SelectItem value="America/Rio_Branco">Rio Branco (GMT-5)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Moeda Padrão</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="BRL">Real (R$)</SelectItem>
                <SelectItem value="USD">Dólar (US$)</SelectItem>
                <SelectItem value="EUR">Euro (€)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
