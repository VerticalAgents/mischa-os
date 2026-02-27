
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CalendarIcon, Save, CheckCircle2, Loader2 } from "lucide-react";
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
import { useClienteStore } from "@/hooks/useClienteStore";
import { useToast } from "@/hooks/use-toast";
import { TipoPedidoAgendamento } from "@/types";
import ProdutoQuantidadeSelector from "./ProdutoQuantidadeSelector";
import ObservacoesAgendamentoSection from "./ObservacoesAgendamentoSection";
import { TrocaPendente } from "./TrocasPendentesEditor";
import { supabase } from "@/integrations/supabase/client";
import { registrarReagendamentoEntreSemanas } from "@/utils/reagendamentoUtils";

interface AgendamentoEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agendamento: AgendamentoItem | null;
  onSalvar: (agendamento: AgendamentoItem) => void;
  gestaoclick_venda_id?: string;
  onAtualizarVendaGC?: () => Promise<{ success: boolean; vendaExcluida: boolean }>;
}

interface ItemPedidoCustomizado {
  produto: string;
  quantidade: number;
}

export default function AgendamentoEditModal({
  open,
  onOpenChange,
  agendamento,
  onSalvar,
  gestaoclick_venda_id,
  onAtualizarVendaGC
}: AgendamentoEditModalProps) {
  const [dataReposicao, setDataReposicao] = useState<Date>();
  const [statusAgendamento, setStatusAgendamento] = useState<"Agendar" | "Previsto" | "Agendado">("Previsto");
  const [tipoPedido, setTipoPedido] = useState<TipoPedidoAgendamento>("Padrão");
  const [quantidadeTotal, setQuantidadeTotal] = useState<number>(0);
  const [itensPersonalizados, setItensPersonalizados] = useState<ItemPedidoCustomizado[]>([]);
  const [dadosCarregados, setDadosCarregados] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Novos estados para observações e trocas
  const [observacoesGerais, setObservacoesGerais] = useState<string>("");
  const [observacoesAgendamento, setObservacoesAgendamento] = useState<string>("");
  const [trocasPendentes, setTrocasPendentes] = useState<TrocaPendente[]>([]);
  
  const { salvarAgendamento, carregarAgendamentoPorCliente } = useAgendamentoClienteStore();
  const { atualizarCliente } = useClienteStore();
  const { toast } = useToast();

  // Carrega dados apenas uma vez quando o agendamento muda
  useEffect(() => {
    const carregarDadosModal = async () => {
      if (agendamento && open && !dadosCarregados) {
        console.log('🔄 Carregando dados do agendamento no modal:', agendamento);
        
        setDataReposicao(agendamento.dataReposicao);
        setStatusAgendamento(agendamento.statusAgendamento);
        const validTipoPedido = agendamento.pedido?.tipoPedido === "Único" ? "Padrão" : (agendamento.pedido?.tipoPedido || "Padrão");
        setTipoPedido(validTipoPedido as TipoPedidoAgendamento);
        setQuantidadeTotal(agendamento.pedido?.totalPedidoUnidades || agendamento.cliente.quantidadePadrao);
        
        // Carregar observações gerais do cliente
        try {
          const { data: clienteData } = await supabase
            .from('clientes')
            .select('observacoes')
            .eq('id', agendamento.cliente.id)
            .single();
          
          setObservacoesGerais(clienteData?.observacoes || "");
        } catch (error) {
          console.error('Erro ao carregar observações do cliente:', error);
          setObservacoesGerais("");
        }
        
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
              produto: item.nomeSabor || `Sabor ${item.idSabor}`,
              quantidade: item.quantidadeSabor
            }));
            setItensPersonalizados(itens);
          } else {
            setItensPersonalizados([]);
          }

          // Carregar observações do agendamento e trocas pendentes
          if (agendamentoAtual) {
            const { data: agendamentoDb } = await supabase
              .from('agendamentos_clientes')
              .select('observacoes_agendamento, trocas_pendentes')
              .eq('cliente_id', agendamento.cliente.id)
              .single();
            
            setObservacoesAgendamento(agendamentoDb?.observacoes_agendamento || "");
            
            // Parse trocas_pendentes (pode ser string JSON ou array)
            const trocas = agendamentoDb?.trocas_pendentes;
            if (trocas && Array.isArray(trocas)) {
              setTrocasPendentes(trocas as unknown as TrocaPendente[]);
            } else {
              setTrocasPendentes([]);
            }
          }
        } catch (error) {
          console.error('❌ Erro ao carregar dados do banco, usando dados do prop:', error);
          
          // Fallback para dados do agendamento passado como prop
          if (agendamento.pedido?.itensPedido && agendamento.pedido.itensPedido.length > 0) {
            const itens = agendamento.pedido.itensPedido.map(item => ({
              produto: item.nomeSabor || `Sabor ${item.idSabor}`,
              quantidade: item.quantidadeSabor
            }));
            setItensPersonalizados(itens);
          } else {
            setItensPersonalizados([]);
          }
          setObservacoesAgendamento("");
          setTrocasPendentes([]);
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

    setIsSaving(true);
    
    try {
      // Registrar reagendamento entre semanas se a data mudou
      if (agendamento.dataReposicao && dataReposicao.getTime() !== agendamento.dataReposicao.getTime()) {
        registrarReagendamentoEntreSemanas(
          agendamento.cliente.id,
          agendamento.dataReposicao,
          dataReposicao
        );
      }

      // Salvar observações gerais no cliente (permanentes)
      await supabase
        .from('clientes')
        .update({ observacoes: observacoesGerais })
        .eq('id', agendamento.cliente.id);

      // Salvar agendamento com observações temporárias e trocas
      // IMPORTANTE: Ao editar agendamento, limpar gestaoclick_nf_id para permitir regenerar NF
      await salvarAgendamento(agendamento.cliente.id, {
        status_agendamento: statusAgendamento,
        data_proxima_reposicao: dataReposicao,
        tipo_pedido: tipoPedido,
        quantidade_total: quantidadeTotal,
        itens_personalizados: tipoPedido === "Alterado" ? itensPersonalizados : null
      });

      // Limpar gestaoclick_nf_id para permitir regenerar NF após edição
      await supabase
        .from('agendamentos_clientes')
        .update({ gestaoclick_nf_id: null })
        .eq('cliente_id', agendamento.cliente.id);

      // Salvar observações do agendamento e trocas pendentes separadamente
      await supabase
        .from('agendamentos_clientes')
        .update({
          observacoes_agendamento: observacoesAgendamento || null,
          trocas_pendentes: trocasPendentes.length > 0 ? JSON.parse(JSON.stringify(trocasPendentes)) : []
        })
        .eq('cliente_id', agendamento.cliente.id);

      // Auto-update GestaoClick if sale exists
      if (gestaoclick_venda_id && onAtualizarVendaGC) {
        const result = await onAtualizarVendaGC();
        
        if (result.vendaExcluida) {
          toast({
            title: "Atenção",
            description: "Agendamento salvo. Venda foi excluída no GestaoClick - você pode gerar uma nova.",
            variant: "default"
          });
        } else if (result.success) {
          toast({
            title: "Sucesso",
            description: `Agendamento e venda GC #${gestaoclick_venda_id} atualizados`
          });
        } else {
          toast({
            title: "Atenção",
            description: "Agendamento salvo, mas erro ao atualizar GestaoClick",
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Sucesso",
          description: "Agendamento atualizado com sucesso"
        });
      }

      const agendamentoAtualizado: AgendamentoItem = {
        ...agendamento,
        dataReposicao,
        statusAgendamento,
        pedido: tipoPedido === "Alterado" ? {
          id: 0,
          idCliente: agendamento.cliente.id,
          dataPedido: new Date(),
          dataPrevistaEntrega: dataReposicao,
          statusPedido: 'Agendado',
          itensPedido: itensPersonalizados.map((item, index) => ({
            id: index,
            idPedido: 0,
            idSabor: index,
            nomeSabor: item.produto,
            quantidadeSabor: item.quantidade,
            sabor: {
              nome: item.produto
            }
          })),
          totalPedidoUnidades: quantidadeTotal,
          tipoPedido
        } : undefined
      };

      onSalvar(agendamentoAtualizado);
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao salvar agendamento:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar agendamento",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
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
          {gestaoclick_venda_id && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Venda GestaoClick vinculada: <strong>#{gestaoclick_venda_id}</strong>
                <span className="text-sm text-green-600 ml-2">
                  (será atualizada automaticamente ao salvar)
                </span>
              </AlertDescription>
            </Alert>
          )}

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
              <Select value={tipoPedido} onValueChange={(value: TipoPedidoAgendamento) => setTipoPedido(value)}>
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
              <PopoverContent className="w-auto p-0" align="start" onInteractOutside={(e) => e.stopPropagation()}>
                <Calendar
                  mode="single"
                  selected={dataReposicao}
                  onSelect={setDataReposicao}
                  locale={ptBR}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="quantidade">Quantidade Total</Label>
              {hasValidationError && (
                <p className="text-sm text-red-500">
                  Total deve ser igual à soma das quantidades dos produtos ({somaQuantidadesProdutos})
                </p>
              )}
            </div>
            <Input
              id="quantidade"
              type="number"
              value={quantidadeTotal}
              onChange={(e) => setQuantidadeTotal(Number(e.target.value))}
              min="0"
              className={hasValidationError ? "border-red-500" : ""}
            />
          </div>

          {tipoPedido === "Alterado" && (
            <div className="space-y-4 border-t pt-4">
              <ProdutoQuantidadeSelector
                value={itensPersonalizados}
                onChange={setItensPersonalizados}
                clienteId={agendamento.cliente.id}
                quantidadeTotal={quantidadeTotal}
                onQuantidadeTotalChange={setQuantidadeTotal}
              />
            </div>
          )}

          {/* Nova seção de observações e trocas */}
          <ObservacoesAgendamentoSection
            observacoesGerais={observacoesGerais}
            onObservacoesGeraisChange={setObservacoesGerais}
            observacoesAgendamento={observacoesAgendamento}
            onObservacoesAgendamentoChange={setObservacoesAgendamento}
            trocasPendentes={trocasPendentes}
            onTrocasPendentesChange={setTrocasPendentes}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSalvar} 
            className="flex items-center gap-2"
            disabled={hasValidationError || isSaving}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
