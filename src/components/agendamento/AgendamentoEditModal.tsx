
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
import { toast } from "sonner";
import { AlertTriangle, Save, Calendar } from "lucide-react";

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

// Helper para converter Date para string de input date (formato local)
const formatDateForInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper para converter string de input date para Date local
const parseDateFromInput = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
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
  const [periodicidade, setPeriodicidade] = useState(7);
  const [tipoPedido, setTipoPedido] = useState<'Padrão' | 'Alterado'>('Padrão');
  const [produtosQuantidades, setProdutosQuantidades] = useState<ProdutoQuantidade[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Usar tanto o store local quanto o Supabase para garantir que temos produtos
  const { produtos: produtosLocal } = useProdutoStore();
  const { produtos: produtosSupabase, loading: loadingSupabase } = useSupabaseProdutos();
  const { salvarAgendamento } = useAgendamentoClienteStore();

  // Decidir qual fonte de produtos usar - priorizar Supabase se disponível
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

  // Debug apenas no console em desenvolvimento
  useEffect(() => {
    if (agendamento && open && process.env.NODE_ENV === 'development') {
      console.log('🔍 DEBUG DETALHADO - Modal aberto para cliente:', agendamento.cliente.nome);
      console.log('🔍 DEBUG - Categorias habilitadas do cliente:', agendamento.cliente.categoriasHabilitadas);
      console.log('🔍 DEBUG - Produtos Supabase carregados:', produtosSupabase.length);
      console.log('🔍 DEBUG - Produtos Local carregados:', produtosLocal.length);
      console.log('🔍 DEBUG - Produtos finais escolhidos:', produtos.length);
      console.log('🔍 DEBUG - Loading Supabase:', loadingSupabase);
    }
  }, [agendamento, open, produtos.length, produtosSupabase.length, produtosLocal.length, loadingSupabase]);

  // Filtrar produtos baseado nas categorias habilitadas do cliente
  const produtosFiltrados = produtos.filter(produto => {
    // Debug apenas no console em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 DEBUG FILTRO - Verificando produto:', {
        nome: produto.nome,
        categoriaId: produto.categoriaId,
        categoria: produto.categoria,
        ativo: produto.ativo,
        clienteCategorias: agendamento?.cliente.categoriasHabilitadas
      });
    }

    // Se não há produtos ou cliente, retornar array vazio
    if (!agendamento?.cliente || !produto) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ DEBUG FILTRO - Cliente ou produto inválido');
      }
      return false;
    }

    // Se produto não está ativo, filtrar fora
    if (!produto.ativo) {
      if (process.env.NODE_ENV === 'development') {
        console.log('❌ DEBUG FILTRO - Produto inativo:', produto.nome);
      }
      return false;
    }

    // Se cliente não tem categorias habilitadas, mostrar todos os produtos ativos
    if (!agendamento.cliente.categoriasHabilitadas || agendamento.cliente.categoriasHabilitadas.length === 0) {
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ DEBUG FILTRO - Cliente sem categorias específicas, produto incluído:', produto.nome);
      }
      return true;
    }

    // Verificar se o produto está em uma categoria habilitada
    const categoriaHabilitada = agendamento.cliente.categoriasHabilitadas.includes(produto.categoriaId);
    if (process.env.NODE_ENV === 'development') {
      console.log(`${categoriaHabilitada ? '✅' : '❌'} DEBUG FILTRO - Produto ${produto.nome} categoria ${produto.categoriaId} habilitada:`, categoriaHabilitada);
    }
    
    return categoriaHabilitada;
  });

  // Debug dos produtos filtrados apenas no console
  useEffect(() => {
    if (agendamento && open && process.env.NODE_ENV === 'development') {
      console.log('🔍 DEBUG FINAL - Produtos após filtro:', produtosFiltrados.length);
      console.log('🔍 DEBUG FINAL - Produtos filtrados:', produtosFiltrados.map(p => ({
        nome: p.nome,
        categoriaId: p.categoriaId,
        categoria: p.categoria
      })));
    }
  }, [produtosFiltrados.length, agendamento, open]);

  // Carregar dados do agendamento ao abrir o modal - usando EXATAMENTE os dados da tabela
  useEffect(() => {
    if (agendamento && open) {
      console.log('Carregando dados no modal para cliente:', agendamento.cliente.nome);
      console.log('Dados do agendamento na tabela:', {
        statusAgendamento: agendamento.statusAgendamento,
        dataReposicao: agendamento.dataReposicao,
        quantidade: agendamento.pedido?.totalPedidoUnidades || agendamento.cliente.quantidadePadrao,
        tipoPedido: agendamento.pedido?.tipoPedido
      });

      // Usar EXATAMENTE os dados exibidos na tabela
      setStatusAgendamento(agendamento.statusAgendamento as 'Agendar' | 'Previsto' | 'Agendado');
      
      // Usar a data EXATA da tabela, sem conversões adicionais
      setProximaDataReposicao(formatDateForInput(agendamento.dataReposicao));
      
      // Usar a quantidade EXATA da tabela
      const quantidadeExibida = agendamento.pedido?.totalPedidoUnidades || agendamento.cliente.quantidadePadrao || 0;
      setQuantidadeTotal(quantidadeExibida);
      
      // Usar o tipo de pedido EXATO da tabela
      const tipoPedidoExibido = agendamento.pedido?.tipoPedido as 'Padrão' | 'Alterado' || 'Padrão';
      setTipoPedido(tipoPedidoExibido);
      
      // Usar a periodicidade do cliente
      setPeriodicidade(agendamento.cliente.periodicidadePadrao || 7);
      
      // Inicializar produtos com quantidades se for tipo "Alterado"
      if (tipoPedidoExibido === 'Alterado' && produtosFiltrados.length > 0) {
        const produtosIniciais = produtosFiltrados.map(produto => ({
          produto: produto.nome,
          quantidade: 0
        }));
        setProdutosQuantidades(produtosIniciais);
      } else {
        setProdutosQuantidades([]);
      }

      console.log('Dados carregados no modal:', {
        statusAgendamento: agendamento.statusAgendamento,
        proximaDataReposicao: formatDateForInput(agendamento.dataReposicao),
        quantidadeTotal: quantidadeExibida,
        tipoPedido: tipoPedidoExibido
      });
    }
  }, [agendamento, open, produtosFiltrados.length]);

  // Inicializar produtos com quantidades quando o tipo for "Alterado"
  useEffect(() => {
    if (tipoPedido === 'Alterado' && produtosFiltrados.length > 0 && produtosQuantidades.length === 0) {
      const produtosIniciais = produtosFiltrados.map(produto => ({
        produto: produto.nome,
        quantidade: 0
      }));
      setProdutosQuantidades(produtosIniciais);
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 DEBUG - Inicializando produtos para tipo Alterado:', produtosIniciais.length);
      }
    }
  }, [tipoPedido, produtosFiltrados.length, produtosQuantidades.length]);

  // Formatar periodicidade em texto
  const formatPeriodicidade = (dias: number): string => {
    if (dias % 7 === 0) {
      const semanas = dias / 7;
      return semanas === 1 ? "1 semana" : `${semanas} semanas`;
    } else if (dias === 3) {
      return "3x semana";
    } else {
      return `${dias} dias`;
    }
  };

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
      const dadosAgendamento: Partial<AgendamentoCliente> = {
        status_agendamento: statusAgendamento,
        data_proxima_reposicao: proximaDataReposicao ? parseDateFromInput(proximaDataReposicao) : undefined,
        quantidade_total: quantidadeTotal,
        tipo_pedido: tipoPedido,
        itens_personalizados: tipoPedido === 'Alterado' ? produtosQuantidades : undefined
      };

      console.log('Salvando agendamento modal com data input:', proximaDataReposicao, '-> convertida para:', dadosAgendamento.data_proxima_reposicao);
      await salvarAgendamento(agendamento.cliente.id, dadosAgendamento);
      
      // Atualizar o agendamento local para refletir as mudanças na tabela
      const agendamentoAtualizado: AgendamentoItem = {
        ...agendamento,
        statusAgendamento,
        dataReposicao: proximaDataReposicao ? parseDateFromInput(proximaDataReposicao) : agendamento.dataReposicao,
        pedido: agendamento.pedido ? {
          ...agendamento.pedido,
          totalPedidoUnidades: quantidadeTotal,
          tipoPedido
        } : {
          totalPedidoUnidades: quantidadeTotal,
          tipoPedido,
          id: 0,
          idCliente: agendamento.cliente.id,
          dataPedido: new Date(),
          dataPrevistaEntrega: agendamento.dataReposicao,
          statusPedido: 'Agendado',
          itensPedido: []
        }
      };

      onSalvar(agendamentoAtualizado);
      onOpenChange(false);
      
    } catch (error) {
      console.error('Erro ao salvar agendamento:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!agendamento) return null;

  // Calcular soma das quantidades dos produtos
  const somaQuantidadesProdutos = produtosQuantidades.reduce((soma, produto) => soma + produto.quantidade, 0);
  
  // Verificar se há erro de validação
  const hasValidationError = tipoPedido === 'Alterado' && somaQuantidadesProdutos !== quantidadeTotal;

  // Verificar se data é obrigatória
  const isDataObrigatoria = statusAgendamento === 'Previsto' || statusAgendamento === 'Agendado';
  const hasDataError = isDataObrigatoria && !proximaDataReposicao;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Editar Agendamento - {agendamento.cliente.nome}
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
                  onChange={(e) => setProximaDataReposicao(e.target.value)}
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
            {/* Quantidade Total */}
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

            {/* Periodicidade */}
            <div className="space-y-2">
              <Label htmlFor="periodicidade">Periodicidade</Label>
              <Select value={periodicidade.toString()} onValueChange={(value) => setPeriodicidade(Number(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3x por semana</SelectItem>
                  <SelectItem value="7">1 semana</SelectItem>
                  <SelectItem value="14">2 semanas</SelectItem>
                  <SelectItem value="21">3 semanas</SelectItem>
                  <SelectItem value="30">1 mês</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Atualmente: {formatPeriodicidade(periodicidade)}
              </p>
            </div>

            {/* Tipo de Pedido */}
            <div className="space-y-3">
              <Label>Tipo de Pedido</Label>
              <RadioGroup 
                value={tipoPedido} 
                onValueChange={(value: 'Padrão' | 'Alterado') => setTipoPedido(value)}
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

            {/* Lista de Produtos (apenas se tipo for "Alterado") */}
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
