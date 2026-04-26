
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X, Edit, Eye, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { useClienteStore } from "@/hooks/useClienteStore";

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
  const navigate = useNavigate();
  const { selecionarCliente } = useClienteStore();

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

  const handleRedirectToCliente = (clienteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    selecionarCliente(clienteId);
    navigate(`/clientes`);
  };

  return (
    <>
      {/* Desktop: tabela */}
      <div className="hidden lg:block">
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
                <div className="flex items-center gap-2">
                  <span>{registro.cliente_nome}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-1 h-6 w-6 opacity-60 hover:opacity-100"
                    onClick={(e) => handleRedirectToCliente(registro.cliente_id, e)}
                    title="Ver informações do cliente"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
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
      </div>

      {/* Mobile: cards */}
      <div className="lg:hidden space-y-2">
        {registros.map((registro) => (
          <div key={registro.id} className="rounded-lg border p-3 bg-card space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <span>{format(new Date(registro.data), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
                {registro.editado_manualmente && (
                  <Edit className="h-3 w-3 text-muted-foreground" />
                )}
              </div>
              {registro.tipo === 'entrega' ? (
                <Badge variant="default" className="bg-green-500 text-white shrink-0">
                  <Check className="h-3 w-3 mr-1" />
                  Entrega
                </Badge>
              ) : (
                <Badge variant="destructive" className="shrink-0">
                  <X className="h-3 w-3 mr-1" />
                  Retorno
                </Badge>
              )}
            </div>

            {showClienteColumn && (
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium truncate">{registro.cliente_nome}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-1 h-6 w-6 opacity-60 hover:opacity-100 shrink-0"
                  onClick={(e) => handleRedirectToCliente(registro.cliente_id, e)}
                  title="Ver informações do cliente"
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            )}

            <div className="text-xs text-muted-foreground line-clamp-2">
              {formatItensParaExibicao(registro.itens)}
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-sm font-medium">{registro.quantidade} unidades</span>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => onVerDetalhes(registro)}>
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onEditarRegistro(registro)}>
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};
