
import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Cliente, Pedido, TipoPedido } from "@/types";
import { toast } from "@/hooks/use-toast";
import { useProdutoStore } from "@/hooks/useProdutoStore";
import { Separator } from "@/components/ui/separator";

interface AgendamentoItem {
  cliente: Cliente;
  pedido?: Pedido;
  dataReposicao: Date;
  statusAgendamento: string;
  isPedidoUnico: boolean;
}

interface EditarAgendamentoDialogProps {
  agendamento: AgendamentoItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (agendamentoAtualizado: AgendamentoItem) => void;
}

interface QuantidadePorProduto {
  [produtoId: number]: number;
}

export default function EditarAgendamentoDialog({
  agendamento,
  open,
  onOpenChange,
  onSave,
}: EditarAgendamentoDialogProps) {
  const { produtos } = useProdutoStore();
  const [dataReposicao, setDataReposicao] = useState<Date>(
    agendamento?.dataReposicao || new Date()
  );
  const [quantidade, setQuantidade] = useState(
    agendamento?.pedido?.totalPedidoUnidades || agendamento?.cliente.quantidadePadrao || 0
  );
  const [status, setStatus] = useState(agendamento?.statusAgendamento || "Previsto");
  const [observacoes, setObservacoes] = useState(
    agendamento?.pedido?.observacoes || ""
  );
  const [tipoPedido, setTipoPedido] = useState<TipoPedido>(
    agendamento?.pedido?.tipoPedido || "Normal"
  );
  const [quantidadesPorProduto, setQuantidadesPorProduto] = useState<QuantidadePorProduto>({});

  // Atualizar estados quando o agendamento mudar
  useEffect(() => {
    if (agendamento) {
      setDataReposicao(agendamento.dataReposicao);
      setQuantidade(agendamento.pedido?.totalPedidoUnidades || agendamento.cliente.quantidadePadrao || 0);
      setStatus(agendamento.statusAgendamento);
      setObservacoes(agendamento.pedido?.observacoes || "");
      setTipoPedido(agendamento.pedido?.tipoPedido || "Normal");
      
      // Inicializar quantidades por produto se for pedido alterado
      if (agendamento.pedido?.tipoPedido === "Alterado" && agendamento.pedido?.itensPedido) {
        const quantidades: QuantidadePorProduto = {};
        agendamento.pedido.itensPedido.forEach(item => {
          quantidades[item.idSabor] = item.quantidadeSabor;
        });
        setQuantidadesPorProduto(quantidades);
      }
    }
  }, [agendamento]);

  if (!agendamento) return null;

  const produtosAtivos = produtos.filter(p => p.ativo);
  
  // Calcular total das quantidades individuais
  const totalQuantidadesIndividuais = Object.values(quantidadesPorProduto).reduce((sum, qty) => sum + (qty || 0), 0);

  const handleQuantidadeProdutoChange = (produtoId: number, valor: string) => {
    const valorNumerico = parseInt(valor) || 0;
    setQuantidadesPorProduto(prev => ({
      ...prev,
      [produtoId]: valorNumerico
    }));
  };

  const handleSave = () => {
    // Validação para pedidos alterados
    if (tipoPedido === "Alterado" && totalQuantidadesIndividuais !== quantidade) {
      toast({
        title: "Erro de validação",
        description: `A soma das quantidades por produto (${totalQuantidadesIndividuais}) deve ser igual à quantidade total (${quantidade}).`,
        variant: "destructive"
      });
      return;
    }

    const agendamentoAtualizado: AgendamentoItem = {
      ...agendamento,
      dataReposicao,
      statusAgendamento: status,
      pedido: agendamento.pedido ? {
        ...agendamento.pedido,
        totalPedidoUnidades: quantidade,
        observacoes,
        dataPrevistaEntrega: format(dataReposicao, 'yyyy-MM-dd'),
        tipoPedido,
      } : undefined,
    };

    onSave(agendamentoAtualizado);
    onOpenChange(false);
    
    toast({
      title: "Agendamento atualizado",
      description: `Alterações salvas para ${agendamento.cliente.nome}`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Agendamento</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome do Cliente</Label>
              <Input value={agendamento.cliente.nome} readOnly className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Input 
                value={agendamento.isPedidoUnico ? "Pedido Único" : "PDV"} 
                readOnly 
                className="bg-muted" 
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Data da Reposição</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dataReposicao && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dataReposicao ? format(dataReposicao, "dd/MM/yyyy") : "Selecionar data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dataReposicao}
                  onSelect={(date) => date && setDataReposicao(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Quantidade Total</Label>
            <Input
              type="number"
              value={quantidade}
              onChange={(e) => setQuantidade(Number(e.target.value))}
              min="1"
            />
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Previsto">Previsto</SelectItem>
                <SelectItem value="Agendado">Agendado</SelectItem>
                <SelectItem value="Reagendar">Reagendar</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Tipo de Pedido</Label>
            <Select value={tipoPedido} onValueChange={(value: TipoPedido) => setTipoPedido(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Normal">Normal</SelectItem>
                <SelectItem value="Reposição">Reposição</SelectItem>
                <SelectItem value="Especial">Especial</SelectItem>
                <SelectItem value="Alterado">Alterado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {tipoPedido === "Alterado" && (
            <>
              <Separator />
              <div className="space-y-4">
                <Label className="text-base font-semibold">Quantidades por Produto</Label>
                {produtosAtivos.map((produto) => (
                  <div key={produto.id} className="flex items-center gap-4">
                    <div className="flex-1">
                      <Label htmlFor={`produto-${produto.id}`} className="text-sm">
                        {produto.nome}
                      </Label>
                    </div>
                    <div className="w-24">
                      <Input
                        id={`produto-${produto.id}`}
                        type="number"
                        min="0"
                        value={quantidadesPorProduto[produto.id] || ''}
                        onChange={(e) => handleQuantidadeProdutoChange(produto.id, e.target.value)}
                        placeholder="0"
                        className="text-center"
                      />
                    </div>
                  </div>
                ))}
                <div className="text-sm text-muted-foreground">
                  <span>Total das quantidades: </span>
                  <span className={`font-medium ${
                    totalQuantidadesIndividuais === quantidade ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {totalQuantidadesIndividuais} / {quantidade}
                  </span>
                </div>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Observações adicionais..."
              className="min-h-[80px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            Salvar alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
