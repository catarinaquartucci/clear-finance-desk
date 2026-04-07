import { useState, useMemo } from "react";
import { useSuppliers, Supplier, SupplierInsert } from "@/hooks/useSuppliers";
import { useGroupCompanies } from "@/hooks/useGroupCompanies";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Search, Filter, ArrowUp, ArrowDown, ArrowUpDown, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { CompanyFilter } from "@/components/finance/CompanyFilter";
import { formatCPFCNPJ } from "@/lib/masks";
import { useAppPreferences } from "@/contexts/AppPreferencesContext";

const emptyForm: SupplierInsert = {
  name: "", document: "", contact_email: "", contact_phone: "",
  address: "", bank_name: "", bank_agency: "", bank_account: "",
  pix_key: "", category: "", active: true, company_id: "3d37326f-bedc-4a16-b81f-0213c826d423",
};

type SortColumn = "name" | "document" | "category" | "company_id" | "contact_email" | "active";
type SortDir = "asc" | "desc";
type ColumnFilters = Record<string, Set<string>>;

const ColumnFilterPopover = ({
  column,
  values,
  selected,
  onToggle,
  onSelectAll,
  onClear,
}: {
  column: string;
  values: string[];
  selected: Set<string>;
  onToggle: (v: string) => void;
  onSelectAll: () => void;
  onClear: () => void;
}) => {
  const [filterSearch, setFilterSearch] = useState("");
  const filtered = values.filter(v => v.toLowerCase().includes(filterSearch.toLowerCase()));
  const hasActive = selected.size > 0 && selected.size < values.length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-5 w-5 ml-1 p-0">
          <Filter className={`w-3 h-3 ${selected.size > 0 ? "text-primary fill-primary" : "text-muted-foreground"}`} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start">
        <Input
          placeholder="Buscar..."
          value={filterSearch}
          onChange={e => setFilterSearch(e.target.value)}
          className="h-8 text-xs mb-2"
        />
        <div className="flex gap-1 mb-2">
          <Button variant="outline" size="sm" className="h-6 text-xs flex-1" onClick={onSelectAll}>Todos</Button>
          <Button variant="outline" size="sm" className="h-6 text-xs flex-1" onClick={onClear}>Limpar</Button>
        </div>
        <div className="max-h-48 overflow-y-auto space-y-1">
          {filtered.map(v => (
            <label key={v} className="flex items-center gap-2 px-1 py-0.5 rounded hover:bg-accent cursor-pointer text-xs">
              <Checkbox
                checked={selected.has(v)}
                onCheckedChange={() => onToggle(v)}
                className="h-3.5 w-3.5"
              />
              <span className="truncate">{v || "(vazio)"}</span>
            </label>
          ))}
          {filtered.length === 0 && <p className="text-xs text-muted-foreground text-center py-2">Nenhum resultado</p>}
        </div>
      </PopoverContent>
    </Popover>
  );
};

const SortableHeader = ({
  label,
  column,
  sortColumn,
  sortDir,
  onSort,
  filterPopover,
}: {
  label: string;
  column: SortColumn;
  sortColumn: SortColumn | null;
  sortDir: SortDir;
  onSort: (col: SortColumn) => void;
  filterPopover?: React.ReactNode;
}) => {
  const isActive = sortColumn === column;
  const Icon = isActive ? (sortDir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;

  return (
    <div className="flex items-center gap-0.5">
      <button
        className="flex items-center gap-1 hover:text-foreground transition-colors text-xs font-medium"
        onClick={() => onSort(column)}
      >
        {label}
        <Icon className={`w-3 h-3 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
      </button>
      {filterPopover}
    </div>
  );
};

export const SuppliersList = () => {
  const { selectedCompanyId } = useAppPreferences();
  const { data: suppliers, isLoading, create, update, remove } = useSuppliers(selectedCompanyId);
  const { companies } = useGroupCompanies();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState<SupplierInsert>(emptyForm);
  const [search, setSearch] = useState("");
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>({});

  const getCompanyName = (id: string | null) => id === null ? "Ambas" : (companies.find(c => c.id === id)?.name ?? "—");

  // Unique values for filterable columns
  const uniqueValues = useMemo(() => {
    if (!suppliers) return { category: [], company_id: [], active: [] };
    return {
      category: [...new Set(suppliers.map(s => s.category || ""))].sort(),
      company_id: [...new Set(suppliers.map(s => getCompanyName(s.company_id)))].sort(),
      active: ["Ativo", "Inativo"],
    };
  }, [suppliers, companies]);

  const toggleFilter = (col: string, value: string) => {
    setColumnFilters(prev => {
      const next = { ...prev };
      const set = new Set(next[col] || []);
      if (set.has(value)) set.delete(value); else set.add(value);
      if (set.size === 0) delete next[col]; else next[col] = set;
      return next;
    });
  };

  const selectAllFilter = (col: string, values: string[]) => {
    setColumnFilters(prev => ({ ...prev, [col]: new Set(values) }));
  };

  const clearFilter = (col: string) => {
    setColumnFilters(prev => {
      const next = { ...prev };
      delete next[col];
      return next;
    });
  };

  const clearAllFilters = () => setColumnFilters({});

  const handleSort = (col: SortColumn) => {
    if (sortColumn === col) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(col);
      setSortDir("asc");
    }
  };

  const activeFilterKeys = Object.keys(columnFilters);

  const filtered = useMemo(() => {
    let list = suppliers ?? [];

    // Global search
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(s => s.name.toLowerCase().includes(q) || s.document?.toLowerCase().includes(q));
    }

    // Column filters
    if (columnFilters.category) {
      list = list.filter(s => columnFilters.category.has(s.category || ""));
    }
    if (columnFilters.company_id) {
      list = list.filter(s => columnFilters.company_id.has(getCompanyName(s.company_id)));
    }
    if (columnFilters.active) {
      list = list.filter(s => columnFilters.active.has(s.active ? "Ativo" : "Inativo"));
    }

    // Sort
    if (sortColumn) {
      list = [...list].sort((a, b) => {
        let va: string, vb: string;
        if (sortColumn === "active") {
          va = a.active ? "Ativo" : "Inativo";
          vb = b.active ? "Ativo" : "Inativo";
        } else if (sortColumn === "company_id") {
          va = getCompanyName(a.company_id);
          vb = getCompanyName(b.company_id);
        } else {
          va = (a[sortColumn] || "").toLowerCase();
          vb = (b[sortColumn] || "").toLowerCase();
        }
        return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
      });
    }

    return list;
  }, [suppliers, search, columnFilters, sortColumn, sortDir, companies]);

  const handleOpen = (supplier?: Supplier) => {
    if (supplier) {
      setEditing(supplier);
      setForm({ name: supplier.name, document: supplier.document, contact_email: supplier.contact_email, contact_phone: supplier.contact_phone, address: supplier.address, bank_name: supplier.bank_name, bank_agency: supplier.bank_agency, bank_account: supplier.bank_account, pix_key: supplier.pix_key, category: supplier.category, active: supplier.active, company_id: supplier.company_id });
    } else {
      setEditing(null);
      setForm(emptyForm);
    }
    setOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    const payload = { ...form, company_id: form.company_id === null ? null : form.company_id };
    if (editing) {
      update.mutate({ id: editing.id, ...payload }, { onSuccess: () => setOpen(false) });
    } else {
      create.mutate(payload, { onSuccess: () => setOpen(false) });
    }
  };

  const filterLabels: Record<string, string> = { category: "Categoria", company_id: "Filial", active: "Status" };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex gap-2 flex-1 min-w-0">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar fornecedor..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpen()}><Plus className="w-4 h-4 mr-2" />Novo Fornecedor</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editing ? "Editar" : "Novo"} Fornecedor</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><Label>Nome *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div><Label>CNPJ/CPF</Label><Input value={form.document ?? ""} onChange={e => setForm(f => ({ ...f, document: formatCPFCNPJ(e.target.value) }))} /></div>
              <div><Label>Categoria</Label><Input value={form.category ?? ""} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} /></div>
              <div><Label>Email</Label><Input value={form.contact_email ?? ""} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))} /></div>
              <div><Label>Telefone</Label><Input value={form.contact_phone ?? ""} onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))} /></div>
              <div className="col-span-2"><Label>Endereço</Label><Input value={form.address ?? ""} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} /></div>
              <div><Label>Banco</Label><Input value={form.bank_name ?? ""} onChange={e => setForm(f => ({ ...f, bank_name: e.target.value }))} /></div>
              <div><Label>Agência</Label><Input value={form.bank_agency ?? ""} onChange={e => setForm(f => ({ ...f, bank_agency: e.target.value }))} /></div>
              <div><Label>Conta</Label><Input value={form.bank_account ?? ""} onChange={e => setForm(f => ({ ...f, bank_account: e.target.value }))} /></div>
              <div><Label>Chave PIX</Label><Input value={form.pix_key ?? ""} onChange={e => setForm(f => ({ ...f, pix_key: e.target.value }))} /></div>
              <div>
                <Label>Filial</Label>
                <CompanyFilter value={form.company_id ?? "none"} onChange={v => setForm(f => ({ ...f, company_id: v === "none" ? null : v }))} formMode className="w-full" />
              </div>
              <div className="flex items-end gap-2 pb-1">
                <Switch checked={form.active} onCheckedChange={v => setForm(f => ({ ...f, active: v }))} />
                <Label>Ativo</Label>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={create.isPending || update.isPending}>{editing ? "Salvar" : "Criar"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active filters bar */}
      {activeFilterKeys.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Filtros:</span>
          {activeFilterKeys.map(col => (
            <Badge key={col} variant="secondary" className="gap-1 text-xs">
              {filterLabels[col] || col}: {columnFilters[col].size} selecionado(s)
              <button onClick={() => clearFilter(col)}><X className="w-3 h-3" /></button>
            </Badge>
          ))}
          <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={clearAllFilters}>Limpar todos</Button>
        </div>
      )}

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Carregando...</p>
      ) : (
        <div className="border rounded-lg overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <SortableHeader label="Nome" column="name" sortColumn={sortColumn} sortDir={sortDir} onSort={handleSort} />
                </TableHead>
                <TableHead>
                  <SortableHeader label="CNPJ/CPF" column="document" sortColumn={sortColumn} sortDir={sortDir} onSort={handleSort} />
                </TableHead>
                <TableHead>
                  <SortableHeader label="Categoria" column="category" sortColumn={sortColumn} sortDir={sortDir} onSort={handleSort}
                    filterPopover={
                      <ColumnFilterPopover
                        column="category"
                        values={uniqueValues.category}
                        selected={columnFilters.category || new Set()}
                        onToggle={v => toggleFilter("category", v)}
                        onSelectAll={() => selectAllFilter("category", uniqueValues.category)}
                        onClear={() => clearFilter("category")}
                      />
                    }
                  />
                </TableHead>
                <TableHead>
                  <SortableHeader label="Filial" column="company_id" sortColumn={sortColumn} sortDir={sortDir} onSort={handleSort}
                    filterPopover={
                      <ColumnFilterPopover
                        column="company_id"
                        values={uniqueValues.company_id}
                        selected={columnFilters.company_id || new Set()}
                        onToggle={v => toggleFilter("company_id", v)}
                        onSelectAll={() => selectAllFilter("company_id", uniqueValues.company_id)}
                        onClear={() => clearFilter("company_id")}
                      />
                    }
                  />
                </TableHead>
                <TableHead>
                  <SortableHeader label="Email" column="contact_email" sortColumn={sortColumn} sortDir={sortDir} onSort={handleSort} />
                </TableHead>
                <TableHead>
                  <SortableHeader label="Status" column="active" sortColumn={sortColumn} sortDir={sortDir} onSort={handleSort}
                    filterPopover={
                      <ColumnFilterPopover
                        column="active"
                        values={uniqueValues.active}
                        selected={columnFilters.active || new Set()}
                        onToggle={v => toggleFilter("active", v)}
                        onSelectAll={() => selectAllFilter("active", uniqueValues.active)}
                        onClear={() => clearFilter("active")}
                      />
                    }
                  />
                </TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhum fornecedor encontrado</TableCell></TableRow>
              ) : filtered.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.document || "—"}</TableCell>
                  <TableCell>{s.category || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{getCompanyName(s.company_id)}</TableCell>
                  <TableCell>{s.contact_email || "—"}</TableCell>
                  <TableCell><Badge variant={s.active ? "default" : "secondary"}>{s.active ? "Ativo" : "Inativo"}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => handleOpen(s)}><Pencil className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => remove.mutate(s.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};
