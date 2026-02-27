import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, Plus, Trash2, GripVertical } from "lucide-react";
import { useSystemSettings } from "@/hooks/useSystemSettings";

const DEFAULT_RULES = [
  {
    title: "1. Reembolsos",
    items: [
      "Antes de realizar qualquer despesa, é obrigatório solicitar validação prévia da Diretoria.",
      "Reembolsos autorizados serão pagos no dia 10 do mês seguinte.",
      "É obrigatório anexar comprovante e justificativa no formulário.",
      "Reembolsos solicitados sem validação prévia, sem comprovante ou por mensagem não serão reembolsados.",
      "Caso a solicitação retorne para ajuste, o prazo passa a contar a partir do reenvio completo.",
    ],
  },
  {
    title: "2. Pagamentos a Fornecedores",
    items: [
      "Todas as faturas, boletos e notas recebidas em um mês são pagas no dia 30 do mês seguinte (ou no dia útil anterior).",
      "Não realizamos pagamentos dentro do mesmo mês, independentemente da data de envio, vencimento ou urgência.",
    ],
  },
  {
    title: "3. Prestadores de Serviço / PJ",
    items: [
      "Notas fiscais devem ser enviadas até o dia 02 pela Central Financeira.",
      "Pagamentos são realizados até o 5º dia útil do mês, para notas enviadas dentro do prazo.",
      "Notas enviadas após o dia 02 serão pagas no dia 30 do mesmo mês.",
      "Pagamentos são feitos exclusivamente para a conta bancária vinculada ao CNPJ da nota.",
      "Notas com divergências serão devolvidas para correção e a data do pagamento será atualizada.",
    ],
  },
  {
    title: "4. Comissões",
    items: [
      "Os valores das comissões devem ser informados pela Diretoria até o dia 10 do mês subsequente ao fechamento.",
      "A nota fiscal de comissão deve ser enviada até o dia 10 do mês de pagamento.",
      "Pagamento é realizado no dia 15 do mês seguinte ao subsequente.",
      "Exemplo: Comissão referente a Outubro → NF enviada até 10/12 → pagamento 15/12.",
    ],
  },
  {
    title: "5. Devoluções a Clientes",
    items: [
      "Devoluções são realizadas em até 5 dias úteis após validação.",
      "É obrigatório anexar o comprovante do pagamento original e preencher o formulário específico.",
      "A devolução será feita somente para a mesma conta que realizou o pagamento.",
      "Obs.: Esta é a única operação financeira processada dentro do mesmo mês.",
    ],
  },
];

interface RuleSection {
  title: string;
  items: string[];
}

export const RegrasEditor = () => {
  const { settings, isLoading, getSetting, upsertSetting } = useSystemSettings("rules");
  const [rules, setRules] = useState<RuleSection[]>(DEFAULT_RULES);
  const [headerText, setHeaderText] = useState(
    "Toda a organização do fluxo financeiro é planejada no mês anterior.\nNão realizamos pagamentos dentro do mesmo mês, exceto devoluções a clientes.\nAs solicitações de Reembolso, Devolução a Cliente e envio de Nota Fiscal, devem ser feitas exclusivamente pela Central Financeira."
  );
  const [importantText, setImportantText] = useState(
    "Solicitações fora do prazo, incompletas ou enviadas por mensagem não serão processadas.\nEm caso de dúvida sobre centro de custo, categoria ou procedimento, consulte o Financeiro antes de enviar."
  );

  useEffect(() => {
    if (!isLoading && settings.length > 0) {
      const savedRules = getSetting("financial_rules");
      if (savedRules) setRules(savedRules);
      const savedHeader = getSetting("rules_header_text");
      if (savedHeader) setHeaderText(savedHeader);
      const savedImportant = getSetting("rules_important_text");
      if (savedImportant) setImportantText(savedImportant);
    }
  }, [isLoading, settings]);

  const handleSave = () => {
    upsertSetting.mutate({ key: "financial_rules", value: rules, category: "rules" });
    upsertSetting.mutate({ key: "rules_header_text", value: headerText, category: "rules" });
    upsertSetting.mutate({ key: "rules_important_text", value: importantText, category: "rules" });
  };

  const updateRuleTitle = (index: number, title: string) => {
    const updated = [...rules];
    updated[index].title = title;
    setRules(updated);
  };

  const updateRuleItem = (ruleIndex: number, itemIndex: number, value: string) => {
    const updated = [...rules];
    updated[ruleIndex].items[itemIndex] = value;
    setRules(updated);
  };

  const addItem = (ruleIndex: number) => {
    const updated = [...rules];
    updated[ruleIndex].items.push("");
    setRules(updated);
  };

  const removeItem = (ruleIndex: number, itemIndex: number) => {
    const updated = [...rules];
    updated[ruleIndex].items.splice(itemIndex, 1);
    setRules(updated);
  };

  const addSection = () => {
    setRules([...rules, { title: `${rules.length + 1}. Nova Seção`, items: [""] }]);
  };

  const removeSection = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  if (isLoading) return <div className="text-muted-foreground">Carregando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Regras e Políticas Financeiras</h3>
          <p className="text-sm text-muted-foreground">
            Edite os textos que aparecem na página inicial do sistema.
          </p>
        </div>
        <Button onClick={handleSave} disabled={upsertSetting.isPending}>
          <Save className="w-4 h-4 mr-2" />
          Salvar Alterações
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Texto de Introdução</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={headerText}
            onChange={(e) => setHeaderText(e.target.value)}
            rows={4}
            placeholder="Texto introdutório das regras..."
          />
        </CardContent>
      </Card>

      {rules.map((rule, ruleIndex) => (
        <Card key={ruleIndex}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div className="flex items-center gap-2 flex-1">
              <GripVertical className="w-4 h-4 text-muted-foreground" />
              <Input
                value={rule.title}
                onChange={(e) => updateRuleTitle(ruleIndex, e.target.value)}
                className="font-semibold text-base"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeSection(ruleIndex)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {rule.items.map((item, itemIndex) => (
              <div key={itemIndex} className="flex gap-2 items-start">
                <span className="text-sm text-muted-foreground mt-2.5 min-w-[24px]">
                  {itemIndex + 1}.
                </span>
                <Textarea
                  value={item}
                  onChange={(e) => updateRuleItem(ruleIndex, itemIndex, e.target.value)}
                  rows={2}
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(ruleIndex, itemIndex)}
                  className="text-destructive hover:text-destructive mt-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => addItem(ruleIndex)}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              Adicionar Item
            </Button>
          </CardContent>
        </Card>
      ))}

      <Button variant="outline" onClick={addSection} className="w-full">
        <Plus className="w-4 h-4 mr-2" />
        Adicionar Nova Seção
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Texto "Importante"</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={importantText}
            onChange={(e) => setImportantText(e.target.value)}
            rows={4}
            placeholder="Avisos importantes..."
          />
        </CardContent>
      </Card>
    </div>
  );
};
