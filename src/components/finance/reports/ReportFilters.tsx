import { format } from "date-fns";
import { CalendarIcon, FileSpreadsheet, FileText, Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CompanyFilter } from "@/components/finance/CompanyFilter";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ReportFiltersProps {
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  companyId: string;
  onDateFromChange: (d: Date | undefined) => void;
  onDateToChange: (d: Date | undefined) => void;
  onCompanyChange: (v: string) => void;
  onExportExcel?: () => void;
  onExportPDF?: () => void;
  showCompany?: boolean;
}

export const ReportFilters = ({
  dateFrom,
  dateTo,
  companyId,
  onDateFromChange,
  onDateToChange,
  onCompanyChange,
  onExportExcel,
  onExportPDF,
  showCompany = true,
}: ReportFiltersProps) => {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-6 p-4 rounded-xl bg-muted/30 border border-border/50">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Filter className="w-4 h-4" />
        <span className="text-sm font-medium">Filtros</span>
      </div>

      <Separator orientation="vertical" className="h-6 hidden sm:block" />

      {/* Date From */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className={cn("w-[150px] justify-start text-left font-normal", !dateFrom && "text-muted-foreground")}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateFrom ? format(dateFrom, "dd/MM/yyyy") : "De"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={dateFrom} onSelect={onDateFromChange} initialFocus className="p-3 pointer-events-auto" />
        </PopoverContent>
      </Popover>

      {/* Date To */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className={cn("w-[150px] justify-start text-left font-normal", !dateTo && "text-muted-foreground")}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateTo ? format(dateTo, "dd/MM/yyyy") : "Até"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={dateTo} onSelect={onDateToChange} initialFocus className="p-3 pointer-events-auto" />
        </PopoverContent>
      </Popover>

      {/* Company */}
      {showCompany && (
        <CompanyFilter value={companyId} onChange={onCompanyChange} className="w-[180px]" />
      )}

      {/* Clear */}
      {(dateFrom || dateTo || companyId !== "all") && (
        <Button variant="ghost" size="sm" onClick={() => { onDateFromChange(undefined); onDateToChange(undefined); onCompanyChange("all"); }}>
          <X className="w-4 h-4 mr-1" /> Limpar
        </Button>
      )}

      {(onExportExcel || onExportPDF) && (
        <>
          <div className="ml-auto" />
          <Separator orientation="vertical" className="h-6 hidden sm:block" />
          <TooltipProvider>
            <div className="flex gap-2">
              {onExportExcel && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={onExportExcel} className="gap-1.5">
                      <FileSpreadsheet className="w-4 h-4" /> Excel
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Exportar para Excel (.xlsx)</TooltipContent>
                </Tooltip>
              )}
              {onExportPDF && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" onClick={onExportPDF} className="gap-1.5">
                      <FileText className="w-4 h-4" /> PDF
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Exportar para PDF</TooltipContent>
                </Tooltip>
              )}
            </div>
          </TooltipProvider>
        </>
      )}
    </div>
  );
};
