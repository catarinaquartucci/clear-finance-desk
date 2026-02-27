import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, FileSpreadsheet, FileText, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CompanyFilter } from "@/components/finance/CompanyFilter";

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
    <div className="flex flex-wrap items-center gap-3 mb-4">
      {/* Date From */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className={cn("w-[150px] justify-start text-left font-normal", !dateFrom && "text-muted-foreground")}>
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
          <Button variant="outline" className={cn("w-[150px] justify-start text-left font-normal", !dateTo && "text-muted-foreground")}>
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

      <div className="ml-auto flex gap-2">
        {onExportExcel && (
          <Button variant="outline" size="sm" onClick={onExportExcel}>
            <FileSpreadsheet className="w-4 h-4 mr-1" /> Excel
          </Button>
        )}
        {onExportPDF && (
          <Button variant="outline" size="sm" onClick={onExportPDF}>
            <FileText className="w-4 h-4 mr-1" /> PDF
          </Button>
        )}
      </div>
    </div>
  );
};
