
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X, Edit, Eye } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface HistoricoTableProps {
  registros: any[];
  onEditarRegistro: (registro: any) => void;
  onVerDetalhes: (registro: any) => void;
  isLoading: boolean;
  showClienteColumn?: boolean;
}

export const HistoricoTable = ({ 
  registros, 
  onEditarRegistro, 
  onVerDetalhes, 
  isLoading,
  showClienteColumn = true
}: HistoricoTableProps) => {
  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin h-8 w-8 border-b-2 border-primary rounded-full mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Carregando histórico...</p>
      </div>
    );
  }

  if (registros.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Não há registros no histórico com os filtros selecionados.
      </div>
    );
  }

  const formatItensParaExibicao = (itens: any[]) => {
    if (!Array.isArray(itens) || itens.length === 0) return 'Sem itens';
    
    return itens.map((item, index) => {
      const nome = item.produto_nome || `Produto ${item.produto_id?.substring(0, 8) || 'N/A'}`;
      return `${nome} (${item.quantidade})`;
    }).join(', ');
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Data</TableHead>
          {showClienteColumn && <TableHead>Cliente</TableHead>}
          <TableHead>Tipo</TableHead>
          <TableHead>Itens</TableHead>
          <TableHead>Quantidade</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {registros.map((registro) => (
          <TableRow key={registro.id}>
            <TableCell>
              {format(new Date(registro.data), "dd/MM/yyyy HH:mm", { locale: ptBR })}
              {registro.editado_manualmente && (
                <Edit className="inline h-3 w-3 ml-2 text-muted-foreground" />
              )}
            </TableCell>
            {showClienteColumn && (
              <TableCell className="font-medium">
                {registro.cliente_nome}
              </TableCell>
            )}
            <TableCell>
              {registro.tipo === 'entrega' ? (
                <Badge variant="default" className="bg-green-500 text-white">
                  <Check className="h-3 w-3 mr-1" />
                  Entrega
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <X className="h-3 w-3 mr-1" />
                  Retorno
                </Badge>
              )}
            </TableCell>
            <TableCell className="max-w-xs">
              <div className="truncate" title={formatItensParaExibicao(registro.itens)}>
                {formatItensParaExibicao(registro.itens)}
              </div>
            </TableCell>
            <TableCell>{registro.quantidade} unidades</TableCell>
            <TableCell className="text-right">
              <div className="flex gap-1 justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onVerDetalhes(registro)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEditarRegistro(registro)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
