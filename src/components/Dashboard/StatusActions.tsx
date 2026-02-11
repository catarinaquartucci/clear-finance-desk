import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Check, X, DollarSign, Trash2 } from "lucide-react";
import { RequestStatus } from "./StatusBadge";

interface StatusActionsProps {
  currentStatus: RequestStatus;
  onStatusChange: (status: RequestStatus) => void;
  onDelete?: () => void;
  disabled?: boolean;
}

export const StatusActions = ({ currentStatus, onStatusChange, onDelete, disabled }: StatusActionsProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" disabled={disabled}>
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {currentStatus !== "aprovado" && currentStatus !== "approved" && (
          <DropdownMenuItem onClick={() => onStatusChange("aprovado")}>
            <Check className="w-4 h-4 mr-2" />
            Aprovar
          </DropdownMenuItem>
        )}
        {(currentStatus === "aprovado" || currentStatus === "approved") && (
          <DropdownMenuItem onClick={() => onStatusChange("pago")}>
            <DollarSign className="w-4 h-4 mr-2" />
            Marcar como Pago
          </DropdownMenuItem>
        )}
        {currentStatus !== "rejeitado" && currentStatus !== "rejected" && (
          <DropdownMenuItem onClick={() => onStatusChange("rejeitado")}>
            <X className="w-4 h-4 mr-2" />
            Rejeitar
          </DropdownMenuItem>
        )}
        {currentStatus !== "pendente" && currentStatus !== "pending" && (
          <DropdownMenuItem onClick={() => onStatusChange("pendente")}>
            Voltar para Pendente
          </DropdownMenuItem>
        )}
        {onDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={onDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
