
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Check, X, Package, Calendar, User, Edit } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface HistoricoDetalhesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  registro: any;
}

export const HistoricoDetalhesModal = ({ open, onOpenChange, registro }: HistoricoDetalhesModalProps) => {
  if (!registro) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {registro.tipo === 'entrega' ? (
              <Check className="h-5 w-5 text-green-500" />
            ) : (
              <X className="h-5 w-5 text-red-500" />
            )}
            Detalhes do {registro.tipo === 'entrega' ? 'Entrega' : 'Retorno'}
            {registro.editado_manualmente && (
              <Badge variant="outline" className="ml-2">
                <Edit className="h-3 w-3 mr-1" />
                Editado
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Informações básicas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Cliente</p>
                <p className="text-sm text-muted-foreground">{registro.cliente_nome}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Data</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(registro.data), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
            </div>
          </div>

          {/* Status e quantidade */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium mb-1">Tipo de Operação</p>
              {registro.tipo === 'entrega' ? (
                <Badge className="bg-green-500 text-white">
                  <Check className="h-3 w-3 mr-1" />
                  Entrega Confirmada
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <X className="h-3 w-3 mr-1" />
                  Retorno
                </Badge>
              )}
            </div>
            
            <div>
              <p className="text-sm font-medium mb-1">Quantidade Total</p>
              <div className="flex items-center gap-1">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="font-mono">{registro.quantidade} unidades</span>
              </div>
            </div>
          </div>

          {/* Status anterior */}
          {registro.status_anterior && (
            <div>
              <p className="text-sm font-medium mb-1">Status Anterior</p>
              <Badge variant="outline">{registro.status_anterior}</Badge>
            </div>
          )}

          {/* Itens detalhados */}
          {registro.itens && registro.itens.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Itens Entregues</p>
              <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                {registro.itens.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span>{item.produto || item.nome || item.produto_nome || `Item ${index + 1}`}</span>
                    <span className="font-mono">{item.quantidade} un</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Observação */}
          {registro.observacao && (
            <div>
              <p className="text-sm font-medium mb-1">Observação</p>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-sm">{registro.observacao}</p>
              </div>
            </div>
          )}

          {/* Informações de auditoria */}
          <div className="border-t pt-4 text-xs text-muted-foreground">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-medium">Criado em:</span>
                <p>{format(new Date(registro.created_at), "dd/MM/yyyy HH:mm")}</p>
              </div>
              <div>
                <span className="font-medium">Atualizado em:</span>
                <p>{format(new Date(registro.updated_at), "dd/MM/yyyy HH:mm")}</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
