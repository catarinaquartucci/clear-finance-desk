import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, Plus, Trash2, Target } from "lucide-react";
import { useSystemSettings } from "@/hooks/useSystemSettings";

interface Meta {
  name: string;
  target: string;
  unit: string;
  description: string;
}

export const MetasGerais = () => {
  const { isLoading, getSetting, upsertSetting } = useSystemSettings("metrics");
  const [metas, setMetas] = useState<Meta[]>([]);

  useEffect(() => {
    if (!isLoading) {
      const saved = getSetting("general_metrics");
      if (saved) setMetas(saved);
    }
  }, [isLoading]);

  const handleSave = () => {
    upsertSetting.mutate({ key: "general_metrics", value: metas, category: "metrics" });
  };

  const addMeta = () => {
    setMetas([...metas, { name: "", target: "", unit: "", description: "" }]);
  };

  const updateMeta = (index: number, field: keyof Meta, value: string) => {
    const updated = [...metas];
    updated[index][field] = value;
    setMetas(updated);
  };

  const removeMeta = (index: number) => {
    setMetas(metas.filter((_, i) => i !== index));
  };

  if (isLoading) return <div className="text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Metas e KPIs Gerais</h3>
          <p className="text-sm text-muted-foreground">
            Configure metas operacionais e indicadores de desempenho do sistema.
          </p>
        </div>
        <Button onClick={handleSave} disabled={upsertSetting.isPending}>
          <Save className="w-4 h-4 mr-2" />
          Salvar
        </Button>
      </div>

      {metas.length === 0 ? (
        <Card>
          <CardContent className="pt-8 pb-8 text-center text-muted-foreground">
            <Target className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Nenhuma meta cadastrada.</p>
          </CardContent>
        </Card>
      ) : (
        metas.map((meta, index) => (
          <Card key={index}>
            <CardContent className="pt-4 space-y-3">
              <div className="flex justify-between items-start">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1">
                  <div>
                    <Label className="text-xs">Nome do Indicador</Label>
                    <Input value={meta.name} onChange={(e) => updateMeta(index, "name", e.target.value)} placeholder="Ex: NPS" />
                  </div>
                  <div>
                    <Label className="text-xs">Meta</Label>
                    <Input value={meta.target} onChange={(e) => updateMeta(index, "target", e.target.value)} placeholder="Ex: 80" />
                  </div>
                  <div>
                    <Label className="text-xs">Unidade</Label>
                    <Input value={meta.unit} onChange={(e) => updateMeta(index, "unit", e.target.value)} placeholder="Ex: pontos, %, R$" />
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="text-destructive ml-2" onClick={() => removeMeta(index)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <div>
                <Label className="text-xs">Descrição</Label>
                <Textarea value={meta.description} onChange={(e) => updateMeta(index, "description", e.target.value)} rows={2} placeholder="Breve descrição..." />
              </div>
            </CardContent>
          </Card>
        ))
      )}

      <Button variant="outline" onClick={addMeta} className="w-full">
        <Plus className="w-4 h-4 mr-2" />
        Adicionar Meta
      </Button>
    </div>
  );
};
