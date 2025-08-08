
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MovTipo } from "@/types/estoque";
import { HistoricoCompletaModal } from "./HistoricoCompletaModal";

interface MovimentacaoBase {
  id: string;
  tipo: MovTipo;
  quantidade: number;
  data_movimentacao: string;
  observacao?: string;
  created_at: string;
}

interface HistoricoMovimentacoesProps {
  itemId: string;
  itemNome: string;
  tipoItem: 'produto' | 'insumo';
  movimentacoes: MovimentacaoBase[];
  loading?: boolean;
}

const getTipoBadgeVariant = (tipo: MovTipo) => {
  switch (tipo) {
    case 'entrada': return 'default';
    case 'saida': return 'destructive';
    case 'ajuste': return 'secondary';
    default: return 'outline';
  }
};

const getTipoLabel = (tipo: MovTipo) => {
  switch (tipo) {
    case 'entrada': return 'Entrada';
    case 'saida': return 'Saída';
    case 'ajuste': return 'Ajuste';
    default: return tipo;
  }
};

export default function HistoricoMovimentacoes({
  itemId,
  itemNome,
  tipoItem,
  movimentacoes,
  loading = false
}: HistoricoMovimentacoesProps) {
  const [modalOpen, setModalOpen] = useState(false);

  // Pegar apenas as últimas 50 movimentações
  const ultimasMovimentacoes = movimentacoes.slice(0, 50);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Movimentações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center py-8">
            <div className="text-muted-foreground">Carregando histórico...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Histórico de Movimentações (últimas 50)</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              Ver todas
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ultimasMovimentacoes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Sem movimentações ainda
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Quantidade</TableHead>
                  <TableHead>Observação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ultimasMovimentacoes.map((mov) => (
                  <TableRow key={mov.id}>
                    <TableCell>
                      {format(new Date(mov.data_movimentacao), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getTipoBadgeVariant(mov.tipo)}>
                        {getTipoLabel(mov.tipo)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {mov.quantidade.toFixed(3)}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {mov.observacao || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <HistoricoCompletaModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        itemId={itemId}
        itemNome={itemNome}
        tipoItem={tipoItem}
      />
    </>
  );
}
