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
import { useProporoesPadrao } from "@/hooks/useProporoesPadrao";

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

// Função segura para formatar data para input preservando o valor local
const formatDateForInput = (date: Date): string => {
  // Usar métodos locais para evitar problemas de timezone
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const formatted = `${year}-${month}-${day}`;
  console.log('📅 Formatando data para input:', { 
    original: date, 
    dia: date.getDate(),
    mes: date.getMonth() + 1,
    ano: date.getFullYear(),
    formatted 
  });
  return formatted;
};

// Função segura para converter string do input para Date preservando o valor local
const parseDateFromInput = (dateString: string): Date => {
  if (!dateString) {
    console.log('⚠️ String de data vazia');
    return new Date();
  }
  
  const [year, month, day] = dateString.split('-').map(Number);
  // Usar new Date(year, month-1, day) para criar data local
  const date = new Date(year, month - 1, day);
  console.log('📅 Convertendo string para Date:', { 
    input: dateString, 
    yearParsed: year,
    monthParsed: month,
    dayParsed: day,
    resultDate: date,
    resultDay: date.getDate(),
    resultMonth: date.getMonth() + 1,
    resultYear: date.getFullYear()
  });
  return date;
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
  
  const { calcularQuantidadesPorProporcao, temProporcoesConfiguradas } = useProporoesPadrao();

  // Usar tanto o store local quanto o Supabase para garantir que temos produtos
  const { produtos: produtosLocal } = useProdutoStore();
  const { produtos: produtosSupabase, loading: loadingSupabase } = useSupabaseProdutos();
  const { salvarAgendamento, carregarAgendamentoPorCliente } = useAgendamentoClienteStore();

  // CORREÇÃO: Lógica de produtos unificada com logs detalhados
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

  console.log('🔍 DEBUG - Produtos disponíveis:', {
    totalProdutos: produtos.length,
    produtosSupabase: produtosSupabase.length,
    produtosLocal: produtosLocal.length,
    produtos: produtos.map(p => ({ id: p.id, nome: p.nome, ativo: p.ativo }))
  });

  // CORREÇÃO: Filtro de produtos melhorado com logs detalhados
  const produtosFiltrados = produtos.filter(produto => {
    console.log('🔍 Analisando produto:', produto.nome, {
      ativo: produto.ativo,
      clienteExiste: !!agendamento?.cliente,
      categoriasHabilitadas: agendamento?.cliente?.categoriasHabilitadas
    });

    // Primeiro filtro: produto deve existir e estar ativo
    if (!produto || !produto.ativo) {
      console.log('❌ Produto inativo ou inexistente:', produto?.nome);
      return false;
    }

    // Segundo filtro: cliente deve existir
    if (!agendamento?.cliente) {
      console.log('❌ Cliente não encontrado para filtro');
      return false;
    }

    // Terceiro filtro: se não há categorias habilitadas, liberar todos os produtos ativos
    if (!agendamento.cliente.categoriasHabilitadas || agendamento.cliente.categoriasHabilitadas.length === 0) {
      console.log('✅ Produto liberado (sem filtro de categoria):', produto.nome);
      return true;
    }

    // Quarto filtro: produto deve pertencer às categorias habilitadas
    const pertenceCategoria = agendamento.cliente.categoriasHabilitadas.includes(produto.categoriaId);
    console.log('🔍 Verificando categoria do produto:', {
      produto: produto.nome,
      categoriaId: produto.categoriaId,
      categoriasHabilitadas: agendamento.cliente.categoriasHabilitadas,
      pertence: pertenceCategoria
    });

    if (pertenceCategoria) {
      console.log('✅ Produto aprovado no filtro:', produto.nome);
    } else {
      console.log('❌ Produto rejeitado por categoria:', produto.nome);
    }

    return pertenceCategoria;
  });

  console.log('🎯 DEBUG - Produtos filtrados finais:', {
    totalFiltrados: produtosFiltrados.length,
    produtos: produtosFiltrados.map(p => ({ id: p.id, nome: p.nome, categoriaId: p.categoriaId }))
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
            
            // Formatação da data usando função segura
            if (agendamentoCompleto.data_proxima_reposicao) {
              const dataFormatada = formatDateForInput(agendamentoCompleto.data_proxima_reposicao);
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

  // CORREÇÃO PRINCIPAL: Atualizar produtos com quantidades para tipo "Alterado"
  useEffect(() => {
    const atualizarProdutosQuantidades = async () => {
      console.log('🔄 Atualizando produtos quantidades:', {
        tipoPedido,
        produtosFiltradosLength: produtosFiltrados.length,
        produtosQuantidadesLength: produtosQuantidades.length
      });

      if (tipoPedido === 'Alterado' && produtosFiltrados.length > 0) {
        console.log('🎯 Configurando produtos para tipo Alterado');
        
        // Para tipo "Alterado", sempre mostrar TODOS os produtos filtrados
        // Preservar quantidades existentes ou inicializar com 0
        const produtosParaEdicao = produtosFiltrados.map(produto => {
          const produtoExistente = produtosQuantidades.find(p => p.produto === produto.nome);
          console.log('➕ Configurando produto para edição:', {
            nome: produto.nome,
            quantidadeExistente: produtoExistente?.quantidade || 0
          });
          
          return {
            produto: produto.nome,
            quantidade: produtoExistente?.quantidade || 0
          };
        });
        
        console.log('✅ Produtos configurados para edição:', produtosParaEdicao);
        setProdutosQuantidades(produtosParaEdicao);
        
      } else if (tipoPedido === 'Padrão') {
        // Para pedidos padrão, calcular automaticamente as quantidades
        if (quantidadeTotal > 0 && temProporcoesConfiguradas()) {
          try {
            const quantidadesCalculadas = await calcularQuantidadesPorProporcao(quantidadeTotal);
            console.log('📊 Quantidades calculadas para padrão:', quantidadesCalculadas);
            setProdutosQuantidades(quantidadesCalculadas);
          } catch (error) {
            console.error('Erro ao calcular quantidades por proporção:', error);
            setProdutosQuantidades([]);
          }
        } else {
          setProdutosQuantidades([]);
        }
      }
    };

    atualizarProdutosQuantidades();
  }, [tipoPedido, produtosFiltrados, quantidadeTotal, calcularQuantidadesPorProporcao, temProporcoesConfiguradas]);

  // Atualizar quantidade de um produto específico
  const atualizarQuantidadeProduto = (produtoNome: string, novaQuantidade: number) => {
    console.log('🔄 Atualizando quantidade do produto:', produtoNome, 'para:', novaQuantidade);
    
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
      console.log('💾 Iniciando salvamento do agendamento');
      console.log('📅 Data no estado antes de salvar:', proximaDataReposicao);
      
      // Converter a data string para Date object usando função segura
      let dataParaBanco: Date | undefined;
      if (proximaDataReposicao) {
        dataParaBanco = parseDateFromInput(proximaDataReposicao);
        console.log('💾 Data convertida para salvamento:', {
          input_string: proximaDataReposicao,
          parsed_date: dataParaBanco,
          dia: dataParaBanco.getDate(),
          mes: dataParaBanco.getMonth() + 1,
          ano: dataParaBanco.getFullYear()
        });
      }

      const dadosAgendamento: Partial<AgendamentoCliente> = {
        status_agendamento: statusAgendamento,
        data_proxima_reposicao: dataParaBanco,
        quantidade_total: quantidadeTotal,
        tipo_pedido: tipoPedido,
        itens_personalizados: tipoPedido === 'Alterado' ? produtosQuantidades : undefined
      };

      console.log('💾 Dados completos para salvamento:', {
        cliente: agendamento.cliente.nome,
        dados: dadosAgendamento
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
  const hasProporcaoError = tipoPedido === 'Padrão' && !temProporcoesConfiguradas();

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
                    console.log('📅 Data alterada no modal (CORRIGIDA):', e.target.value);
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
                  <RadioGroupItem value="Padrão" id="padrao" disabled={!temProporcoesConfiguradas()} />
                  <Label htmlFor="padrao" className={!temProporcoesConfiguradas() ? 'text-muted-foreground' : ''}>
                    Padrão (usa proporção padrão do sistema)
                    {!temProporcoesConfiguradas() && (
                      <span className="text-red-500 text-xs ml-2">
                        - Configure as proporções em Configurações primeiro
                      </span>
                    )}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Alterado" id="alterado" />
                  <Label htmlFor="alterado">Alterado (quantidades personalizadas por produto)</Label>
                </div>
              </RadioGroup>
            </div>

            {hasProporcaoError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Para usar pedidos do tipo "Padrão", você precisa configurar as proporções padrão em 
                  Configurações &gt; % Proporção Padrão primeiro.
                </AlertDescription>
              </Alert>
            )}

            {tipoPedido === 'Padrão' && temProporcoesConfiguradas() && produtosQuantidades.length > 0 && (
              <div className="space-y-4">
                <Label>Quantidades Calculadas (Proporção Padrão)</Label>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="grid gap-2">
                    {produtosQuantidades.map((produto, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="font-medium">{produto.produto}</span>
                        <span className="font-bold">{produto.quantidade} unidades</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 pt-2 border-t text-sm text-muted-foreground">
                    Quantidades calculadas automaticamente com base na proporção padrão configurada
                  </div>
                </div>
              </div>
            )}

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
                    Exibindo todos os produtos ativos das categorias habilitadas para este cliente
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

                {/* DEBUG: Mostrar informações de debug */}
                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                  <strong>Debug Info:</strong> 
                  Produtos filtrados: {produtosFiltrados.length} | 
                  Produtos com quantidades: {produtosQuantidades.length} |
                  Cliente: {agendamento.cliente.nome} |
                  Modo: TODOS os produtos ativos (independente de proporção)
                </div>

                {produtosFiltrados.length === 0 ? (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Nenhum produto disponível para as categorias habilitadas deste cliente.
                      Verifique as configurações de categoria do cliente.
                      
                      <div className="mt-2 text-xs">
                        <strong>Categorias habilitadas:</strong> {agendamento.cliente.categoriasHabilitadas?.join(', ') || 'Nenhuma'}
                      </div>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="grid gap-3 max-h-60 overflow-y-auto">
                    {produtosFiltrados.map((produto) => {
                      const produtoQuantidade = produtosQuantidades.find(p => p.produto === produto.nome);
                      console.log('🎯 Renderizando produto no modal (ALTERADO):', {
                        nome: produto.nome,
                        quantidade: produtoQuantidade?.quantidade || 0,
                        categoriaId: produto.categoriaId
                      });
                      
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
            disabled={isLoading || hasValidationError || hasDataError || hasProporcaoError}
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
