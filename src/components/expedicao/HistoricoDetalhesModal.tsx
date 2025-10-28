
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
import { useSupabaseProporoesPadrao } from "@/hooks/useSupabaseProporoesPadrao";
import { useEffect, useState } from "react";

interface HistoricoDetalhesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  registro: any;
}

interface ItemCalculado {
  produto_nome: string;
  quantidade: number;
  percentual: number;
}

export const HistoricoDetalhesModal = ({ open, onOpenChange, registro }: HistoricoDetalhesModalProps) => {
  const { proporcoes } = useSupabaseProporoesPadrao();
  const [itensCalculados, setItensCalculados] = useState<ItemCalculado[]>([]);
  const [tipoEntrega, setTipoEntrega] = useState<'padrao' | 'alterada' | 'indefinido'>('indefinido');

  useEffect(() => {
    if (!registro || !open) return;

    // Determinar tipo de entrega baseado na presença de itens detalhados
    const temItensDetalhados = registro.itens && registro.itens.length > 0;
    
    if (temItensDetalhados) {
      setTipoEntrega('alterada');
      setItensCalculados([]);
    } else {
      setTipoEntrega('padrao');
      calcularItensPadrao();
    }
  }, [registro, open, proporcoes]);

  const calcularItensPadrao = () => {
    if (!registro || !proporcoes || proporcoes.length === 0) return;

    const quantidadeTotal = registro.quantidade || 0;
    const proporcoesAtivas = proporcoes.filter(p => p.percentual > 0);
    
    if (proporcoesAtivas.length === 0) return;

    // Calcular quantidades usando Math.floor + distribuição do resto
    const itensComQuantidade = proporcoesAtivas.map(prop => ({
      produto_nome: prop.produto_nome,
      percentual: prop.percentual,
      quantidade: Math.floor((prop.percentual / 100) * quantidadeTotal)
    }));

    // Calcular resto e distribuir para o produto com maior proporção
    const totalCalculado = itensComQuantidade.reduce((sum, item) => sum + item.quantidade, 0);
    const resto = quantidadeTotal - totalCalculado;
    
    if (resto > 0) {
      const produtoMaiorProporcao = itensComQuantidade.reduce((prev, current) => 
        prev.percentual > current.percentual ? prev : current
      );
      produtoMaiorProporcao.quantidade += resto;
    }

    setItensCalculados(itensComQuantidade.filter(item => item.quantidade > 0));
  };

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
            Detalhes da {registro.tipo === 'entrega' ? 'Entrega' : 'Retorno'}
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

          {/* Tipo de entrega */}
          <div>
            <p className="text-sm font-medium mb-1">Tipo de Entrega</p>
            <Badge variant={tipoEntrega === 'padrao' ? 'default' : 'secondary'}>
              {tipoEntrega === 'padrao' ? 'Padrão' : tipoEntrega === 'alterada' ? 'Alterada' : 'Indefinido'}
            </Badge>
          </div>

          {/* Status anterior */}
          {registro.status_anterior && (
            <div>
              <p className="text-sm font-medium mb-1">Status Anterior</p>
              <Badge variant="outline">{registro.status_anterior}</Badge>
            </div>
          )}

          {/* Itens entregues - Entrega Alterada */}
          {tipoEntrega === 'alterada' && registro.itens && registro.itens.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Itens Entregues (Alterada)</p>
              <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                {registro.itens.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span>{item.produto_nome || item.produto || item.nome || `Item ${index + 1}`}</span>
                    <span className="font-mono">{item.quantidade} un</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Itens calculados - Entrega Padrão */}
          {tipoEntrega === 'padrao' && itensCalculados.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Produtos Entregues (Padrão - Calculado)</p>
              <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                {itensCalculados.map((item, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                      <span>{item.produto_nome}</span>
                      <Badge variant="outline" className="text-xs">
                        {item.percentual}%
                      </Badge>
                    </div>
                    <span className="font-mono">{item.quantidade} un</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                * Quantidades calculadas baseadas nas proporções padrão configuradas
              </p>
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
