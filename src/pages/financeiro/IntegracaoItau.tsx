import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, RefreshCw, Trash2, Pencil, CheckCircle2, XCircle, Loader2, Landmark } from "lucide-react";
import { useGroupCompanies } from "@/hooks/useGroupCompanies";
import { useBankAccounts } from "@/hooks/useBankAccounts";
import { useItauCredentials, useItauSyncLog, ItauCredential, ItauCredentialFormInput } from "@/hooks/useItauCredentials";
import { useAppPreferences } from "@/contexts/AppPreferencesContext";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const emptyForm: ItauCredentialFormInput = {
  company_id: null,
  bank_account_id: "",
  client_id: "",
  client_secret: "",
  cert_pem: "",
  key_pem: "",
  agencia: "",
  conta: "",
  environment: "sandbox",
  ativo: true,
};

export default function IntegracaoItau() {
  const { selectedCompanyId } = useAppPreferences();
  const { companies } = useGroupCompanies();
  const { data: bankAccounts } = useBankAccounts(selectedCompanyId);
  const { credentials, isLoading, upsert, remove, testConnection, syncNow } = useItauCredentials(selectedCompanyId);
  const { data: logs } = useItauSyncLog();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ItauCredential | null>(null);
  const [form, setForm] = useState<ItauCredentialFormInput>(emptyForm);
  const [testing, setTesting] = useState(false);
  const certInputRef = useRef<HTMLInputElement>(null);
  const keyInputRef = useRef<HTMLInputElement>(null);

  const openNew = () => {
    setEditing(null);
    setForm({ ...emptyForm, company_id: selectedCompanyId ?? null });
    setOpen(true);
  };

  const openEdit = (c: ItauCredential) => {
    setEditing(c);
    setForm({
      id: c.id,
      company_id: c.company_id,
      bank_account_id: c.bank_account_id,
      client_id: c.client_id,
      client_secret: "",
      cert_pem: "",
      key_pem: "",
      agencia: c.agencia,
      conta: c.conta,
      environment: c.environment,
      ativo: c.ativo,
    });
    setOpen(true);
  };

  const readFile = async (file: File) => {
    return await file.text();
  };

  const handleSubmit = async () => {
    if (!form.bank_account_id || !form.client_id || !form.agencia || !form.conta) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    if (!editing && (!form.client_secret || !form.cert_pem || !form.key_pem)) {
      toast.error("Client Secret, certificado e chave são obrigatórios no cadastro inicial");
      return;
    }
    await upsert.mutateAsync(form);
    setOpen(false);
  };

  const handleTest = async () => {
    if (!form.client_id || !form.client_secret || !form.cert_pem || !form.key_pem || !form.agencia || !form.conta) {
      toast.error("Preencha todos os campos para testar");
      return;
    }
    setTesting(true);
    try {
      const result = await testConnection.mutateAsync({
        environment: form.environment,
        client_id: form.client_id,
        client_secret: form.client_secret!,
        cert_pem: form.cert_pem!,
        key_pem: form.key_pem!,
        agencia: form.agencia,
        conta: form.conta,
      });
      if ((result as any)?.ok) {
        toast.success("Conexão validada com sucesso!");
      } else {
        toast.error(`Falhou: ${(result as any)?.message ?? "erro desconhecido"}`);
      }
    } catch (e: any) {
      toast.error("Erro: " + (e?.message ?? ""));
    } finally {
      setTesting(false);
    }
  };

  const accountLabel = (id: string) => {
    const a = bankAccounts?.find((b) => b.id === id);
    return a ? `${a.bank_name} • ${a.name}` : id;
  };

  const companyLabel = (id: string | null) => {
    if (!id) return "Todas filiais";
    return companies?.find((c) => c.id === id)?.name ?? "—";
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Landmark className="h-7 w-7 text-primary" />
            Integração Itaú
          </h1>
          <p className="text-muted-foreground">
            Conecte contas Itaú via API para sincronização automática de extratos.
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4 mr-2" /> Adicionar conta Itaú
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Credenciais cadastradas</CardTitle>
          <CardDescription>
            Cada credencial corresponde a uma conta Itaú de uma filial. O sync automático roda diariamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : !credentials?.length ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma credencial cadastrada. Clique em "Adicionar conta Itaú" para começar.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {credentials.map((c) => (
                <Card key={c.id} className="border-2">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-base">{companyLabel(c.company_id)}</CardTitle>
                        <CardDescription className="text-xs mt-1">
                          Ag {c.agencia} • Conta {c.conta}
                        </CardDescription>
                      </div>
                      <Badge variant={c.environment === "production" ? "default" : "secondary"}>
                        {c.environment === "production" ? "Produção" : "Sandbox"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Conta vinculada: </span>
                      <span className="font-medium">{accountLabel(c.bank_account_id)}</span>
                    </div>
                    <div className="text-sm flex items-center gap-2">
                      {c.ativo ? (
                        <><CheckCircle2 className="h-4 w-4 text-primary" /> Ativa</>
                      ) : (
                        <><XCircle className="h-4 w-4 text-muted-foreground" /> Inativa</>
                      )}
                    </div>
                    {c.last_sync_at && (
                      <div className="text-xs text-muted-foreground">
                        Último sync: {format(new Date(c.last_sync_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => syncNow.mutate({ credential_id: c.id, days: 7 })}
                        disabled={syncNow.isPending}
                      >
                        <RefreshCw className={`h-3 w-3 mr-1 ${syncNow.isPending ? "animate-spin" : ""}`} />
                        Sincronizar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openEdit(c)}>
                        <Pencil className="h-3 w-3 mr-1" /> Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive"
                        onClick={() => {
                          if (confirm("Remover esta credencial? Os secrets também serão apagados.")) {
                            remove.mutate(c.id);
                          }
                        }}
                      >
                        <Trash2 className="h-3 w-3 mr-1" /> Remover
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de sincronizações</CardTitle>
          <CardDescription>Últimas 50 execuções (manuais e automáticas).</CardDescription>
        </CardHeader>
        <CardContent>
          {!logs?.length ? (
            <p className="text-center text-muted-foreground py-4 text-sm">Nenhum sync executado ainda.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Início</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead className="text-right">Importados</TableHead>
                  <TableHead className="text-right">Ignorados</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Origem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="text-xs">
                      {format(new Date(l.started_at), "dd/MM HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {l.period_from} → {l.period_to}
                    </TableCell>
                    <TableCell className="text-right">{l.transactions_imported}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{l.transactions_skipped}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          l.status === "success" ? "default" :
                          l.status === "error" ? "destructive" :
                          "secondary"
                        }
                      >
                        {l.status}
                      </Badge>
                      {l.error_message && (
                        <div className="text-xs text-destructive mt-1 max-w-xs truncate" title={l.error_message}>
                          {l.error_message}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {l.triggered_by === "cron" ? "Automático" : "Manual"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar credencial Itaú" : "Nova credencial Itaú"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Filial</Label>
                <Select
                  value={form.company_id ?? "none"}
                  onValueChange={(v) => setForm({ ...form, company_id: v === "none" ? null : v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem filial específica</SelectItem>
                    {companies?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Conta bancária vinculada *</Label>
                <Select
                  value={form.bank_account_id}
                  onValueChange={(v) => setForm({ ...form, bank_account_id: v })}
                >
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {bankAccounts?.filter((a) => a.bank_name?.toLowerCase().includes("ita") || true).map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.bank_name} • {a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Agência *</Label>
                <Input value={form.agencia} onChange={(e) => setForm({ ...form, agencia: e.target.value })} />
              </div>
              <div>
                <Label>Conta *</Label>
                <Input value={form.conta} onChange={(e) => setForm({ ...form, conta: e.target.value })} />
              </div>
              <div>
                <Label>Ambiente</Label>
                <Select
                  value={form.environment}
                  onValueChange={(v: any) => setForm({ ...form, environment: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sandbox">Sandbox</SelectItem>
                    <SelectItem value="production">Produção</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Client ID *</Label>
              <Input value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })} />
            </div>

            <div>
              <Label>
                Client Secret {editing && <span className="text-xs text-muted-foreground">(deixe vazio para manter)</span>}
              </Label>
              <Input
                type="password"
                value={form.client_secret ?? ""}
                onChange={(e) => setForm({ ...form, client_secret: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>
                  Certificado (.crt / .pem) {editing && <span className="text-xs text-muted-foreground">(opcional)</span>}
                </Label>
                <Input
                  ref={certInputRef}
                  type="file"
                  accept=".crt,.pem,.cer"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (f) setForm({ ...form, cert_pem: await readFile(f) });
                  }}
                />
                {form.cert_pem && (
                  <p className="text-xs text-primary mt-1">✓ Certificado carregado ({form.cert_pem.length} chars)</p>
                )}
              </div>
              <div>
                <Label>
                  Chave privada (.key) {editing && <span className="text-xs text-muted-foreground">(opcional)</span>}
                </Label>
                <Input
                  ref={keyInputRef}
                  type="file"
                  accept=".key,.pem"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (f) setForm({ ...form, key_pem: await readFile(f) });
                  }}
                />
                {form.key_pem && (
                  <p className="text-xs text-primary mt-1">✓ Chave carregada ({form.key_pem.length} chars)</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={form.ativo ?? true}
                onCheckedChange={(v) => setForm({ ...form, ativo: v })}
              />
              <Label>Credencial ativa (será incluída no sync diário)</Label>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleTest} disabled={testing}>
              {testing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Testar conexão
            </Button>
            <Button onClick={handleSubmit} disabled={upsert.isPending}>
              {upsert.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
