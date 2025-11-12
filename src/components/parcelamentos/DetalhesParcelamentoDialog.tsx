import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { Parcelamento } from "@/types/parcelamentos";
import { useParcelas } from "@/hooks/useParcelas";

interface DetalhesParcelamentoDialogProps {
  parcelamento: Parcelamento;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DetalhesParcelamentoDialog({
  parcelamento,
  open,
  onOpenChange,
}: DetalhesParcelamentoDialogProps) {
  const { parcelas, isLoading, pagarParcela } = useParcelas(parcelamento.id);

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
      pendente: "default",
      pago: "secondary",
      atrasado: "destructive",
    };

    return (
      <Badge variant={variants[status] || "default"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const handlePagarParcela = (parcelaId: string) => {
    pagarParcela({
      id: parcelaId,
      data_pagamento: new Date().toISOString().split('T')[0],
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes do Parcelamento</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Descrição</p>
              <p className="font-medium">{parcelamento.descricao}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tipo</p>
              <p className="font-medium">{parcelamento.tipo_parcelamento?.nome}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Cartão</p>
              <p className="font-medium">
                {parcelamento.cartao?.nome} - {parcelamento.cartao?.bandeira}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Valor Total</p>
              <p className="font-medium">{formatCurrency(parcelamento.valor_total)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Data da Compra</p>
              <p className="font-medium">{formatDate(parcelamento.data_compra)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Número de Parcelas</p>
              <p className="font-medium">{parcelamento.numero_parcelas}x</p>
            </div>
          </div>

          {parcelamento.observacoes && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Observações</p>
              <p className="text-sm">{parcelamento.observacoes}</p>
            </div>
          )}

          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">Parcelas</h3>
            {isLoading ? (
              <div className="text-center py-4">Carregando parcelas...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Parcela</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Pagamento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parcelas.map((parcela) => (
                    <TableRow key={parcela.id}>
                      <TableCell>{parcela.numero_parcela}/{parcelamento.numero_parcelas}</TableCell>
                      <TableCell>{formatCurrency(parcela.valor_parcela)}</TableCell>
                      <TableCell>{formatDate(parcela.data_vencimento)}</TableCell>
                      <TableCell>
                        {parcela.data_pagamento ? formatDate(parcela.data_pagamento) : '-'}
                      </TableCell>
                      <TableCell>{getStatusBadge(parcela.status)}</TableCell>
                      <TableCell className="text-right">
                        {parcela.status === 'pendente' || parcela.status === 'atrasado' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePagarParcela(parcela.id)}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Pagar
                          </Button>
                        ) : (
                          <span className="text-sm text-muted-foreground">Pago</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
