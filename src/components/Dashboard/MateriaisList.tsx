import { useState } from "react";
import { useMateriais } from "@/hooks/useMateriais";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "./StatusBadge";
import { StatusActions } from "./StatusActions";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";
import { format } from "date-fns";
import { Package } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface MateriaisListProps {
  embedded?: boolean;
  data?: any[];
}

export const MateriaisList = ({ embedded = false, data }: MateriaisListProps) => {
  const { materiais: fetchedMateriais, isLoading, updateStatus, isUpdating, deleteMaterial, isDeleting } = useMateriais();
  const { canEditAdmin } = useAuth();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // Use provided data or fetched data
  const materiais = data ?? fetchedMateriais;

  const handleDeleteClick = (id: string) => {
    setItemToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (itemToDelete) {
      deleteMaterial(itemToDelete);
    }
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  // Only show loading if we're fetching and no data was provided
  if (isLoading && !data) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Carregando solicitações de materiais...
      </div>
    );
  }

  if (!materiais || materiais.length === 0) {
    if (embedded) {
      return (
        <div className="py-8 text-center text-muted-foreground">
          Nenhuma solicitação de material encontrada
        </div>
      );
    }
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Solicitações de Materiais
          </CardTitle>
          <CardDescription>
            Nenhuma solicitação de material encontrada
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const tableContent = (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Solicitante</TableHead>
              <TableHead>Material</TableHead>
              <TableHead>Centro de Custo</TableHead>
              <TableHead className="hidden lg:table-cell">Justificativa</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Data</TableHead>
              {canEditAdmin && <TableHead className="text-right">Ações</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {materiais.map((material) => (
              <TableRow key={material.id}>
                <TableCell className="font-medium">{material.nome_solicitante}</TableCell>
                <TableCell>{material.material}</TableCell>
                <TableCell>{material.centro_custo}</TableCell>
                <TableCell className="hidden lg:table-cell max-w-xs">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="block truncate cursor-help">
                          {material.justificativa}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-md">
                        <p className="whitespace-pre-wrap">{material.justificativa}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell>
                  <StatusBadge status={material.status} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(material.created_at), "dd/MM/yyyy")}
                </TableCell>
                {canEditAdmin && (
                  <TableCell className="text-right">
                    <StatusActions
                      currentStatus={material.status as any}
                      onStatusChange={(status) => updateStatus({ id: material.id, status })}
                      onDelete={() => handleDeleteClick(material.id)}
                      disabled={isUpdating || isDeleting}
                    />
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="Excluir Material?"
        description="Esta ação não pode ser desfeita."
      />
    </>
  );

  if (embedded) {
    return tableContent;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          Solicitações de Materiais
        </CardTitle>
        <CardDescription>
          Gerencie todas as solicitações de materiais
        </CardDescription>
      </CardHeader>
      <CardContent>
        {tableContent}
      </CardContent>
    </Card>
  );
};
