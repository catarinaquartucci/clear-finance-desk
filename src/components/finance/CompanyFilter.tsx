import { useGroupCompanies } from "@/hooks/useGroupCompanies";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2 } from "lucide-react";

interface CompanyFilterProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  /** If true, show as a form field (no "Todas" option) */
  formMode?: boolean;
}

export const CompanyFilter = ({
  value,
  onChange,
  className = "w-48",
  placeholder = "Todas as filiais",
  formMode = false,
}: CompanyFilterProps) => {
  const { companies } = useGroupCompanies();

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className}>
        <Building2 className="w-4 h-4 mr-1 text-muted-foreground shrink-0" />
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {!formMode && <SelectItem value="all">Todas as filiais</SelectItem>}
        {formMode && <SelectItem value="none">Ambas as filiais</SelectItem>}
        {companies
          .filter((c) => c.active)
          .map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  );
};
