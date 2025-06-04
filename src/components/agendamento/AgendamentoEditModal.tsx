
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useProdutoStore } from "@/hooks/useProdutoStore";
import { useSupabaseProdutos } from "@/hooks/useSupabaseProdutos";
import { useAgendamentoClienteStore, AgendamentoCliente } from "@/hooks/useAgendamentoClienteStore";
import { AgendamentoItem } from "./types";
import { TipoPedidoAgendamento } from "@/types";
import { toast } from "sonner";
import { AlertTriangle, Save, Calendar } from "lucide-react";
import { TipoPedidoBadge } from "@/components/expedicao/TipoPedidoBadge";

interface AgendamentoEditModalProps {
  agendamento: AgendamentoItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSalvar: (agendamento: AgendamentoItem) => void;
}

interface ProdutoQuantidade {
  produto: string;
  quantidade: number;
}

// CORREÇÃO DEFINITIVA: Funções que preservam exatamente a data sem problemas de timezone
const formatDateForInput = (date: Date): string => {
  // Usar getFullYear, getMonth, getDate (métodos locais) para evitar problemas de timezone
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseDateFromInput = (dateString: string): Date => {
  // Usar new Date(year, month, day) em vez de Date.parse para evitar timezone issues
  const [year, month, day] = dateString.split('-').map(Number);
  // month - 1 porque Date() usa meses 0-based (0 = Janeiro)
  return new Date(year, month - 1, day);
};

export default function AgendamentoEditModal({ 
  agendamento, 
  open, 
  onOpenChange, 
  onSalvar 
}: AgendamentoEditModalProps) {
  const [statusAgendamento, setStatusAgendamento] = useState<'Agendar' | 'Previsto' | 'Agendado'>('Agendar');
  const [proximaDataReposicao, setProximaDataReposicao] = useState('');
  const [quantidadeTotal, setQuantidadeTotal] = useState(0);
  const [tipoPedido, setTipoPedido] = useState<TipoPedidoAgendamento>('Padrão');
  const [produtosQuantidades, setProdutosQuantidades] = useState<ProdutoQuantidade[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Usar tanto o store local quanto o Supabase para garantir que temos produtos
  const { produtos: produtosLocal } = useProdutoStore();
  const { produtos: produtosSupabase, loading: loadingSupabase } = useSupabaseProdutos();
  const { salvarAgendamento, carregarAgendamentoPorCliente } = useAgendamentoClienteStore();

  const produtos = produtosSupabase.length > 0 ? produtosSupabase.map(p => ({
    id: parseInt(p.id) || 0,
    nome: p.nome,
    categoria: p.categoria_id ? `Categoria ${p.categoria_id}` : 'Sem categoria',
    categoriaId: p.categoria_id || 0,
    ativo: p.ativo,
    descricao: p.descricao,
    precoVenda: Number(p.preco_venda) || 0,
    custoTotal: Number(p.custo_total) || 0,
    margemLucro: Number(p.margem_lucro) || 0,
    componentes: [],
    pesoUnitario: Number(p.peso_unitario) || 0,
    custoUnitario: Number(p.custo_unitario) || 0,
    unidadesProducao: p.unidades_producao || 1,
    estoqueMinimo: 0,
    subcategoriaId: p.subcategoria_id || 0
  })) : produtosLocal;

  const produtosFiltrados = produtos.filter(produto => {
    if (!agendamento?.cliente || !produto) {
      return false;
    }

    if (!produto.ativo) {
      return false;
    }

    if (!agendamento.cliente.categoriasHabilitadas || agendamento.cliente.categoriasHabilitadas.length === 0) {
      return true;
    }

    return agendamento.cliente.categoriasHabilitadas.includes(produto.categoriaId);
  });

  // Carregar dados do agendamento ao abrir o modal
  useEffect(() => {
    const carregarDadosCompletos = async () => {
      if (agendamento && open) {
        console.log('🔄 Carregando dados completos do agendamento no modal:', agendamento.cliente.nome);
        
        try {
          // Buscar dados atualizados diretamente da tabela
          const agendamentoCompleto = await carregarAgendamentoPorCliente(agendamento.cliente.id);
          
          if (agendamentoCompleto) {
            console.log('✅ Dados completos carregados no modal:', {
              tipo: agendamentoCompleto.tipo_pedido,
              status: agendamentoCompleto.status_agendamento,
              data_original: agendamentoCompleto.data_proxima_reposicao,
              quantidade: agendamentoCompleto.quantidade_total
            });

            // Usar os dados da tabela como fonte da verdade
            setStatusAgendamento(agendamentoCompleto.status_agendamento);
            
            // CORREÇÃO: Formatação segura da data preservando o valor exato
            if (agendamentoCompleto.data_proxima_reposicao) {
              const dataFormatada = formatDateForInput(agendamentoCompleto.data_proxima_reposicao);
              console.log('📅 Data formatada para modal (CORRIGIDA):', {
                original: agendamentoCompleto.data_proxima_reposicao,
                formatada: dataFormatada,
                dia_original: agendamentoCompleto.data_proxima_reposicao.getDate(),
                mes_original: agendamentoCompleto.data_proxima_reposicao.getMonth() + 1,
                ano_original: agendamentoCompleto.data_proxima_reposicao.getFullYear()
              });
              setProximaDataReposicao(dataFormatada);
            } else {
              // Se não há data na base, usar a data do agendamento da lista
              setProximaDataReposicao(formatDateForInput(agendamento.dataReposicao));
            }
            
            setQuantidadeTotal(agendamentoCompleto.quantidade_total);
            setTipoPedido(agendamentoCompleto.tipo_pedido as TipoPedidoAgendamento);
            
            // Carregar itens personalizados se existirem
            if (agendamentoCompleto.tipo_pedido === 'Alterado' && agendamentoCompleto.itens_personalizados) {
              console.log('🎯 Carregando itens personalizados existentes:', agendamentoCompleto.itens_personalizados);
              setProdutosQuantidades(agendamentoCompleto.itens_personalizados);
            } else {
              setProdutosQuantidades([]);
            }
          } else {
            // Fallback para dados da tabela de agendamentos se não houver na tabela específica
            console.log('⚠️ Usando dados da tabela de agendamentos como fallback');
            setStatusAgendamento(agendamento.statusAgendamento as 'Agendar' | 'Previsto' | 'Agendado');
            setProximaDataReposicao(formatDateForInput(agendamento.dataReposicao));
            setQuantidadeTotal(agendamento.pedido?.totalPedidoUnidades || agendamento.cliente.quantidadePadrao || 0);
            setTipoPedido((agendamento.pedido?.tipoPedido === 'Alterado' ? 'Alterado' : 'Padrão') as TipoPedidoAgendamento);
            setProdutosQuantidades([]);
          }
        } catch (error) {
          console.error('❌ Erro ao carregar dados completos:', error);
          // Usar dados básicos em caso de erro
          setStatusAgendamento(agendamento.statusAgendamento as 'Agendar' | 'Previsto' | 'Agendado');
          setProximaDataReposicao(formatDateForInput(agendamento.dataReposicao));
          setQuantidadeTotal(agendamento.pedido?.totalPedidoUnidades || agendamento.cliente.quantidadePadrao || 0);
          setTipoPedido('Padrão');
          setProdutosQuantidades([]);
        }
      }
    };

    carregarDadosCompletos();
  }, [agendamento, open, carregarAgendamentoPorCliente]);

  // Inicializar produtos com quantidades quando o tipo for "Alterado"
  useEffect(() => {
    if (tipoPedido === 'Alterado' && produtosFiltrados.length > 0 && produtosQuantidades.length === 0) {
      const produtosIniciais = produtosFiltrados.map(produto => ({
        produto: produto.nome,
        quantidade: 0
      }));
      setProdutosQuantidades(produtosIniciais);
    } else if (tipoPedido === 'Padrão') {
      setProdutosQuantidades([]);
    }
  }, [tipoPedido, produtosFiltrados.length, produtosQuantidades.length]);

  // Atualizar quantidade de um produto específico
  const atualizarQuantidadeProduto = (produtoNome: string, novaQuantidade: number) => {
    setProdutosQuantidades(prev => 
      prev.map(produto => 
        produto.produto === produtoNome 
          ? { ...produto, quantidade: Math.max(0, novaQuantidade) }
          : produto
      )
    );
  };

  const handleSalvar = async () => {
    if (!agendamento) return;

    if (hasValidationError) {
      toast.error("A soma das quantidades dos produtos deve ser igual ao total do pedido");
      return;
    }

    if (hasDataError) {
      toast.error("Data da próxima reposição é obrigatória para status 'Previsto' ou 'Agendado'");
      return;
    }

    setIsLoading(true);
    try {
      // CORREÇÃO: Conversão segura da data preservando o valor exato
      let dataParaBanco: Date | undefined;
      if (proximaDataReposicao) {
        dataParaBanco = parseDateFromInput(proximaDataReposicao);
        console.log('💾 Data sendo salva (CORRIGIDA):', {
          input_string: proximaDataReposicao,
          parsed_date: dataParaBanco,
          dia_parsed: dataParaBanco.getDate(),
          mes_parsed: dataParaBanco.getMonth() + 1,
          ano_parsed: dataParaBanco.getFullYear(),
          iso_format: dataParaBanco.toISOString()
        });
      }

      const dadosAgendamento: Partial<AgendamentoCliente> = {
        status_agendamento: statusAgendamento,
        data_proxima_reposicao: dataParaBanco,
        quantidade_total: quantidadeTotal,
        tipo_pedido: tipoPedido,
        itens_personalizados: tipoPedido === 'Alterado' ? produtosQuantidades : undefined
      };

      console.log('💾 Salvando agendamento via modal:', {
        cliente: agendamento.cliente.nome,
        dados: dadosAgendamento,
        data_input_original: proximaDataReposicao
      });

      await salvarAgendamento(agendamento.cliente.id, dadosAgendamento);
      
      // Atualizar o agendamento local para refletir as mudanças na tabela
      const agendamentoAtualizado: AgendamentoItem = {
        ...agendamento,
        statusAgendamento,
        dataReposicao: dataParaBanco || agendamento.dataReposicao,
        pedido: agendamento.pedido ? {
          ...agendamento.pedido,
          totalPedidoUnidades: quantidadeTotal,
          tipoPedido: tipoPedido as 'Padrão' | 'Alterado' | 'Único'
        } : {
          totalPedidoUnidades: quantidadeTotal,
          tipoPedido: tipoPedido as 'Padrão' | 'Alterado' | 'Único',
          id: 0,
          idCliente: agendamento.cliente.id,
          dataPedido: new Date(),
          dataPrevistaEntrega: agendamento.dataReposicao,
          statusPedido: 'Agendado',
          itensPedido: [],
          historicoAlteracoesStatus: []
        }
      };

      onSalvar(agendamentoAtualizado);
      onOpenChange(false);

      toast.success(`Agendamento atualizado com sucesso para ${agendamento.cliente.nome}`);
      
    } catch (error) {
      console.error('❌ Erro ao salvar agendamento:', error);
      toast.error("Erro ao salvar agendamento");
    } finally {
      setIsLoading(false);
    }
  };

  if (!agendamento) return null;

  // Calcular soma das quantidades dos produtos
  const somaQuantidadesProdutos = produtosQuantidades.reduce((soma, produto) => soma + produto.quantidade, 0);
  const hasValidationError = tipoPedido === 'Alterado' && somaQuantidadesProdutos !== quantidadeTotal;
  const isDataObrigatoria = statusAgendamento === 'Previsto' || statusAgendamento === 'Agendado';
  const hasDataError = isDataObrigatoria && !proximaDataReposicao;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Editar Agendamento - {agendamento.cliente.nome}
            <TipoPedidoBadge tipo={tipoPedido} />
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Status do Agendamento */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status-agendamento">Status do Agendamento</Label>
                <Select value={statusAgendamento} onValueChange={(value: 'Agendar' | 'Previsto' | 'Agendado') => setStatusAgendamento(value)}>
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
                <Label htmlFor="proxima-data">
                  Data da Próxima Reposição
                  {isDataObrigatoria && <span className="text-red-500 ml-1">*</span>}
                </Label>
                <Input
                  id="proxima-data"
                  type="date"
                  value={proximaDataReposicao}
                  onChange={(e) => {
                    console.log('📅 Data alterada no input (CORRIGIDA):', e.target.value);
                    setProximaDataReposicao(e.target.value);
                  }}
                  className={hasDataError ? "border-red-500" : ""}
                />
                {hasDataError && (
                  <p className="text-sm text-red-500">
                    Data obrigatória para status "{statusAgendamento}"
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Configurações de Reposição */}
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="quantidade-total">Quantidade Total do Pedido</Label>
              <Input
                id="quantidade-total"
                type="number"
                value={quantidadeTotal}
                onChange={(e) => setQuantidadeTotal(Number(e.target.value))}
                min="0"
              />
            </div>

            <div className="space-y-3">
              <Label>Tipo de Pedido</Label>
              <RadioGroup 
                value={tipoPedido} 
                onValueChange={(value: TipoPedidoAgendamento) => setTipoPedido(value)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Padrão" id="padrao" />
                  <Label htmlFor="padrao">Padrão (usa proporção padrão do sistema)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Alterado" id="alterado" />
                  <Label htmlFor="alterado">Alterado (quantidades personalizadas por produto)</Label>
                </div>
              </RadioGroup>
            </div>

            {tipoPedido === 'Alterado' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Quantidades por Produto</Label>
                  <div className="text-sm text-muted-foreground">
                    Total: {somaQuantidadesProdutos} / {quantidadeTotal}
                  </div>
                </div>

                {agendamento.cliente.categoriasHabilitadas && agendamento.cliente.categoriasHabilitadas.length > 0 && (
                  <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                    Exibindo apenas produtos das categorias habilitadas para este cliente
                  </div>
                )}
                
                {hasValidationError && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      A soma das quantidades dos produtos deve ser igual ao total do pedido ({quantidadeTotal})
                    </AlertDescription>
                  </Alert>
                )}

                {produtosFiltrados.length === 0 ? (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Nenhum produto disponível para as categorias habilitadas deste cliente.
                      Verifique as configurações de categoria do cliente.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="grid gap-3 max-h-60 overflow-y-auto">
                    {produtosFiltrados.map((produto) => {
                      const produtoQuantidade = produtosQuantidades.find(p => p.produto === produto.nome);
                      return (
                        <div key={produto.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex flex-col">
                            <span className="font-medium">{produto.nome}</span>
                            {produto.categoria && (
                              <span className="text-xs text-muted-foreground">
                                Categoria: {produto.categoria} (ID: {produto.categoriaId})
                              </span>
                            )}
                          </div>
                          <Input
                            type="number"
                            value={produtoQuantidade?.quantidade || 0}
                            onChange={(e) => atualizarQuantidadeProduto(produto.nome, Number(e.target.value))}
                            min="0"
                            className="w-20"
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSalvar}
            disabled={isLoading || hasValidationError || hasDataError}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {isLoading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
