import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Trash2 } from "lucide-react";
import { useParcelamentos } from "@/hooks/useParcelamentos";
import { Parcelamento } from "@/types/parcelamentos";
import { DetalhesParcelamentoDialog } from "./DetalhesParcelamentoDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function TabelaParcelamentos() {
  const { parcelamentos, isLoading, deleteParcelamento } = useParcelamentos();
  const [selectedParcelamento, setSelectedParcelamento] = useState<Parcelamento | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);

  if (isLoading) {
    return <div className="text-center py-8">Carregando...</div>;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      ativo: "default",
      quitado: "secondary",
      cancelado: "destructive",
    };

    return (
      <Badge variant={variants[status] || "default"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Descrição</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Cartão</TableHead>
            <TableHead>Valor Total</TableHead>
            <TableHead>Parcelas</TableHead>
            <TableHead>Data Compra</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {parcelamentos.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                Nenhum parcelamento cadastrado
              </TableCell>
            </TableRow>
          ) : (
            parcelamentos.map((parcelamento) => (
              <TableRow key={parcelamento.id}>
                <TableCell className="font-medium">{parcelamento.descricao}</TableCell>
                <TableCell>{parcelamento.tipo_parcelamento?.nome}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: parcelamento.cartao?.cor_identificacao }}
                    />
                    {parcelamento.cartao?.nome}
                  </div>
                </TableCell>
                <TableCell>{formatCurrency(parcelamento.valor_total)}</TableCell>
                <TableCell>{parcelamento.numero_parcelas}x</TableCell>
                <TableCell>{formatDate(parcelamento.data_compra)}</TableCell>
                <TableCell>{getStatusBadge(parcelamento.status)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedParcelamento(parcelamento)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteDialog(parcelamento.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {selectedParcelamento && (
        <DetalhesParcelamentoDialog
          parcelamento={selectedParcelamento}
          open={!!selectedParcelamento}
          onOpenChange={(open) => !open && setSelectedParcelamento(null)}
        />
      )}

      <AlertDialog open={!!deleteDialog} onOpenChange={(open) => !open && setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este parcelamento? Esta ação não pode ser desfeita e
              todas as parcelas associadas também serão excluídas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteDialog) {
                  deleteParcelamento(deleteDialog);
                  setDeleteDialog(null);
                }
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
