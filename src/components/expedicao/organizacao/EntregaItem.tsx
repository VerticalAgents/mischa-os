import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { MapPin, Phone, Package, DollarSign, FileText, User } from 'lucide-react';

interface EntregaItemProps {
  entrega: {
    id: string;
    clienteNome: string;
    endereco: string;
    telefone?: string;
    representante: string;
    quantidade: number;
    tipoCobranca: string;
    formaPagamento: string;
    emiteNotaFiscal: boolean;
    precos: { categoria: string; preco: number }[];
    observacao: string;
    selecionada: boolean;
    ordem: number;
  };
  totalEntregas: number;
  onToggleSelecao: (id: string) => void;
  onAtualizarObservacao: (id: string, observacao: string) => void;
  onAtualizarOrdem: (id: string, ordem: number) => void;
}

export const EntregaItem = ({
  entrega,
  totalEntregas,
  onToggleSelecao,
  onAtualizarObservacao,
  onAtualizarOrdem
}: EntregaItemProps) => {
  return (
    <Card className={`p-4 transition-all ${entrega.selecionada ? 'border-primary bg-primary/5' : ''}`}>
      <div className="flex gap-3">
        <div className="pt-1">
          <Checkbox
            checked={entrega.selecionada}
            onCheckedChange={() => onToggleSelecao(entrega.id)}
          />
        </div>

        <div className="flex-1 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-foreground">{entrega.clienteNome}</h3>
              <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
                <User className="w-3.5 h-3.5" />
                <span>{entrega.representante}</span>
              </div>
            </div>
            <div className="flex gap-2">
              {entrega.emiteNotaFiscal && (
                <Badge variant="outline" className="whitespace-nowrap">
                  <FileText className="w-3 h-3 mr-1" />
                  NF
                </Badge>
              )}
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-1.5 text-muted-foreground">
              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{entrega.endereco}</span>
            </div>

            {entrega.telefone && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Phone className="w-4 h-4" />
                <span>{entrega.telefone}</span>
              </div>
            )}

            <div className="flex items-center gap-1.5">
              <Package className="w-4 h-4" />
              <span className="font-medium">{entrega.quantidade} unidades</span>
            </div>

            <div className="flex items-center gap-1.5 text-muted-foreground">
              <DollarSign className="w-4 h-4" />
              <span>{entrega.tipoCobranca} - {entrega.formaPagamento}</span>
            </div>

            {entrega.precos.length > 0 && (
              <div className="ml-5 space-y-1 text-xs">
                {entrega.precos.map((p, i) => (
                  <div key={i} className="text-muted-foreground">
                    • {p.categoria}: R$ {p.preco.toFixed(2)}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Input
              placeholder="Observação (opcional)"
              value={entrega.observacao}
              onChange={(e) => onAtualizarObservacao(entrega.id, e.target.value)}
              className="text-sm"
            />

            {entrega.selecionada && (
              <Select
                value={entrega.ordem.toString()}
                onValueChange={(value) => onAtualizarOrdem(entrega.id, parseInt(value))}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Ordem de entrega" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: totalEntregas }, (_, i) => i + 1).map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num}ª posição
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
