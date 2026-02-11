import { useMyMateriais } from "@/hooks/useMyMateriais";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { StatusBadge } from "./StatusBadge";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useDuplicate } from "@/contexts/DuplicateContext";
import { useNavigate } from "react-router-dom";
import { Copy } from "lucide-react";
import { toast } from "sonner";

export const MyMateriaisList = () => {
  const { materiais, isLoading } = useMyMateriais();
  const { setDuplicateData } = useDuplicate();
  const navigate = useNavigate();

  const handleDuplicate = (material: any) => {
    setDuplicateData({
      type: 'material',
      data: {
        material: material.material,
        centroCusto: material.centro_custo,
        justificativa: material.justificativa,
      }
    });
    navigate('/solicitacoes');
    toast.info("Dados copiados! Preencha os campos restantes.");
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            Carregando suas solicitações de materiais...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!materiais || materiais.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-primary">Minhas Solicitações de Materiais</CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center text-muted-foreground">
          Você ainda não solicitou nenhum material
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card hover:shadow-card-hover transition-all">
      <CardHeader>
        <CardTitle className="text-primary">Minhas Solicitações de Materiais</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>Centro de Custo</TableHead>
                <TableHead className="hidden md:table-cell">Justificativa</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materiais.map((material) => (
                <TableRow key={material.id}>
                  <TableCell className="font-medium">{material.material}</TableCell>
                  <TableCell>{material.centro_custo}</TableCell>
                  <TableCell className="hidden md:table-cell max-w-xs truncate">
                    {material.justificativa}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={material.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(parseISO(material.created_at), "dd/MM/yyyy", { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDuplicate(material)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Duplicar solicitação</p>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
