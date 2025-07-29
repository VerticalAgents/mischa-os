
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CalendarIcon, Save, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AgendamentoItem } from "./types";
import { useAgendamentoClienteStore } from "@/hooks/useAgendamentoClienteStore";
import { useToast } from "@/hooks/use-toast";
import { TipoPedidoAgendamento } from "@/types";
import ProdutoQuantidadeSelector from "./ProdutoQuantidadeSelector";

interface AgendamentoEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agendamento: AgendamentoItem | null;
  onSalvar: (agendamento: AgendamentoItem) => void;
}

interface ItemPedidoCustomizado {
  produto: string;
  quantidade: number;
}

export default function AgendamentoEditModal({
  open,
  onOpenChange,
  agendamento,
  onSalvar
}: AgendamentoEditModalProps) {
  const [dataReposicao, setDataReposicao] = useState<Date>();
  const [statusAgendamento, setStatusAgendamento] = useState<"Agendar" | "Previsto" | "Agendado">("Previsto");
  const [tipoPedido, setTipoPedido] = useState<"Padrão" | "Alterado">("Padrão");
  const [quantidadeTotal, setQuantidadeTotal] = useState<number>(0);
  const [observacoes, setObservacoes] = useState<string>("");
  const [itensPersonalizados, setItensPersonalizados] = useState<ItemPedidoCustomizado[]>([]);
  const [dadosCarregados, setDadosCarregados] = useState(false);
  
  const { salvarAgendamento, carregarAgendamentoPorCliente } = useAgendamentoClienteStore();
  const { toast } = useToast();

  // Carrega dados apenas uma vez quando o agendamento muda
  useEffect(() => {
    const carregarDadosModal = async () => {
      if (agendamento && open && !dadosCarregados) {
        console.log('🔄 Carregando dados do agendamento no modal:', agendamento);
        
        setDataReposicao(agendamento.dataReposicao);
        setStatusAgendamento(agendamento.statusAgendamento);
        const validTipoPedido = agendamento.pedido?.tipoPedido === "Único" ? "Padrão" : (agendamento.pedido?.tipoPedido === "Alterado" ? "Alterado" : "Padrão");
        setTipoPedido(validTipoPedido);
        setQuantidadeTotal(agendamento.pedido?.totalPedidoUnidades || agendamento.cliente.quantidadePadrao);
        setObservacoes("");
        
        // Carregar dados salvos do banco para garantir que estão atualizados
        try {
          const agendamentoAtual = await carregarAgendamentoPorCliente(agendamento.cliente.id);
          
          if (agendamentoAtual && agendamentoAtual.tipo_pedido === 'Alterado' && agendamentoAtual.itens_personalizados) {
            console.log('✅ Carregando itens personalizados salvos:', agendamentoAtual.itens_personalizados);
            setItensPersonalizados(agendamentoAtual.itens_personalizados);
            setQuantidadeTotal(agendamentoAtual.quantidade_total);
            setTipoPedido('Alterado');
          } else if (agendamento.pedido?.itensPedido && agendamento.pedido.itensPedido.length > 0) {
            // Fallback para dados do agendamento passado como prop
            const itens = agendamento.pedido.itensPedido.map(item => ({
              produto: item.nomeSabor || item.produtoNome || `Produto ${item.produtoId}`,
              quantidade: item.quantidadeSabor || item.quantidade
            }));
            setItensPersonalizados(itens);
          } else {
            setItensPersonalizados([]);
          }
        } catch (error) {
          console.error('❌ Erro ao carregar dados do banco, usando dados do prop:', error);
          
          // Fallback para dados do agendamento passado como prop
          if (agendamento.pedido?.itensPedido && agendamento.pedido.itensPedido.length > 0) {
            const itens = agendamento.pedido.itensPedido.map(item => ({
              produto: item.nomeSabor || item.produtoNome || `Produto ${item.produtoId}`,
              quantidade: item.quantidadeSabor || item.quantidade
            }));
            setItensPersonalizados(itens);
          } else {
            setItensPersonalizados([]);
          }
        }

        setDadosCarregados(true);
      }
    };

    // Reset quando o modal fechar
    if (!open) {
      setDadosCarregados(false);
    }

    carregarDadosModal();
  }, [agendamento, open, dadosCarregados, carregarAgendamentoPorCliente]);

  // Limpar itens quando tipo de pedido muda para Padrão
  useEffect(() => {
    if (tipoPedido === 'Padrão') {
      setItensPersonalizados([]);
    }
  }, [tipoPedido]);

  const somaQuantidadesProdutos = itensPersonalizados.reduce((soma, item) => soma + item.quantidade, 0);
  const hasValidationError = tipoPedido === "Alterado" && somaQuantidadesProdutos !== quantidadeTotal;

  const handleSalvar = async () => {
    if (!agendamento || !dataReposicao) return;

    if (hasValidationError) {
      toast({
        title: "Erro de validação",
        description: "A soma das quantidades dos produtos deve ser igual ao total do pedido",
        variant: "destructive"
      });
      return;
    }

    try {
      await salvarAgendamento(agendamento.cliente.id, {
        status_agendamento: statusAgendamento,
        data_proxima_reposicao: dataReposicao,
        tipo_pedido: tipoPedido,
        quantidade_total: quantidadeTotal,
        itens_personalizados: tipoPedido === "Alterado" ? itensPersonalizados : null
      });

      const agendamentoAtualizado: AgendamentoItem = {
        ...agendamento,
        dataReposicao,
        statusAgendamento,
        pedido: tipoPedido === "Alterado" ? {
          ...agendamento.pedido,
          id: agendamento.pedido?.id || '',
          idCliente: agendamento.cliente.id,
          clienteId: agendamento.cliente.id,
          dataPedido: new Date(),
          dataPrevistaEntrega: dataReposicao,
          status: 'Agendado',
          statusPedido: 'Agendado',
          valorTotal: 0,
          observacoes: '',
          dataEntrega: dataReposicao,
          enderecoEntrega: agendamento.cliente.enderecoEntrega,
          contatoEntrega: agendamento.cliente.contatoNome,
          numeroPedidoCliente: '',
          createdAt: new Date(),
          itensPedido: itensPersonalizados.map((item, index) => ({
            id: `${index}`,
            produtoId: `${index}`,
            produtoNome: item.produto,
            quantidade: item.quantidade,
            preco: 0,
            subtotal: 0,
            nomeSabor: item.produto,
            idSabor: `${index}`,
            quantidadeSabor: item.quantidade,
            sabor: {
              nome: item.produto
            }
          })),
          itens: itensPersonalizados.map((item, index) => ({
            id: `${index}`,
            produtoId: `${index}`,
            produtoNome: item.produto,
            quantidade: item.quantidade,
            preco: 0,
            subtotal: 0
          })),
          totalPedidoUnidades: quantidadeTotal,
          tipoPedido: tipoPedido as TipoPedidoAgendamento
        } : agendamento.pedido
      };

      onSalvar(agendamentoAtualizado);
      onOpenChange(false);

      toast({
        title: "Sucesso",
        description: "Agendamento atualizado com sucesso"
      });
    } catch (error) {
      console.error('Erro ao salvar agendamento:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar agendamento",
        variant: "destructive"
      });
    }
  };

  if (!agendamento) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Agendamento</DialogTitle>
          <DialogDescription>
            Editando agendamento para {agendamento.cliente.nome}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status do Agendamento</Label>
              <Select value={statusAgendamento} onValueChange={(value: "Agendar" | "Previsto" | "Agendado") => setStatusAgendamento(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Agendar">Agendar</SelectItem>
                  <SelectItem value="Previsto">Previsto</SelectItem>
                  <SelectItem value="Agendado">Agendado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipoPedido">Tipo do Pedido</Label>
              <Select value={tipoPedido} onValueChange={(value: "Padrão" | "Alterado") => setTipoPedido(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Padrão">Padrão</SelectItem>
                  <SelectItem value="Alterado">Alterado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Data de Reposição</Label>
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
                  {dataReposicao ? format(dataReposicao, "PPP", { locale: ptBR }) : "Selecione uma data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dataReposicao}
                  onSelect={setDataReposicao}
                  locale={ptBR}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantidade">Quantidade Total</Label>
            <Input
              id="quantidade"
              type="number"
              value={quantidadeTotal}
              onChange={(e) => setQuantidadeTotal(Number(e.target.value))}
              min="0"
              className={hasValidationError ? "border-red-500" : ""}
            />
            {hasValidationError && (
              <p className="text-sm text-red-500">
                Total deve ser igual à soma das quantidades dos produtos ({somaQuantidadesProdutos})
              </p>
            )}
          </div>

          {tipoPedido === "Alterado" && (
            <div className="space-y-4 border-t pt-4">
              {hasValidationError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    A soma das quantidades dos produtos ({somaQuantidadesProdutos}) deve ser igual ao total do pedido ({quantidadeTotal}).
                    Diferença: {Math.abs(somaQuantidadesProdutos - quantidadeTotal)} unidades.
                  </AlertDescription>
                </Alert>
              )}
              
              <ProdutoQuantidadeSelector
                value={itensPersonalizados}
                onChange={setItensPersonalizados}
                clienteId={agendamento.cliente.id}
                quantidadeTotal={quantidadeTotal}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Observações adicionais..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSalvar} 
            className="flex items-center gap-2"
            disabled={hasValidationError}
          >
            <Save className="h-4 w-4" />
            Salvar Alterações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
