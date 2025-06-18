
import { useState, useEffect } from 'react';
import { Cliente } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useProdutoStore } from "@/hooks/useProdutoStore";
import { useAgendamentoClienteStore, AgendamentoCliente } from "@/hooks/useAgendamentoClienteStore";
import { useClienteStore } from "@/hooks/useClienteStore";
import { toast } from "@/hooks/use-toast";
import { AlertTriangle, Save, Calendar } from "lucide-react";

interface AgendamentoAtualProps {
  cliente: Cliente;
  onAgendamentoUpdate?: () => void;
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

export default function AgendamentoAtual({ cliente, onAgendamentoUpdate }: AgendamentoAtualProps) {
  const [statusAgendamento, setStatusAgendamento] = useState<'Agendar' | 'Previsto' | 'Agendado'>('Agendar');
  const [proximaDataReposicao, setProximaDataReposicao] = useState('');
  const [quantidadeTotal, setQuantidadeTotal] = useState(0);
  const [tipoPedido, setTipoPedido] = useState<'Padrão' | 'Alterado'>('Padrão');
  const [produtosQuantidades, setProdutosQuantidades] = useState<ProdutoQuantidade[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [agendamentoCarregado, setAgendamentoCarregado] = useState(false);
  
  const { produtos } = useProdutoStore();
  const { carregarAgendamentoPorCliente, salvarAgendamento, loading } = useAgendamentoClienteStore();
  const { carregarClientes } = useClienteStore();

  const produtosFiltrados = produtos.filter(produto => {
    if (!cliente.categoriasHabilitadas || cliente.categoriasHabilitadas.length === 0) {
      return true;
    }
    return cliente.categoriasHabilitadas.includes(produto.categoriaId);
  });

  // Inicializar produtos quando tipoPedido muda para 'Alterado'
  useEffect(() => {
    if (tipoPedido === 'Alterado' && produtosFiltrados.length > 0) {
      // Se não há produtos cadastrados ou se mudou para 'Alterado', inicializar
      if (produtosQuantidades.length === 0) {
        const produtosIniciais = produtosFiltrados.map(produto => ({
          produto: produto.nome,
          quantidade: 0
        }));
        setProdutosQuantidades(produtosIniciais);
        console.log('🎯 Inicializando produtos para tipo Alterado:', produtosIniciais);
      }
    } else if (tipoPedido === 'Padrão') {
      setProdutosQuantidades([]);
    }
  }, [tipoPedido, produtosFiltrados.length]);

  // Carregar dados da tabela agendamentos_clientes
  useEffect(() => {
    const carregarDados = async () => {
      if (!agendamentoCarregado && cliente?.id) {
        try {
          console.log('🔄 Carregando agendamento do cliente:', cliente.id);
          const agendamento = await carregarAgendamentoPorCliente(cliente.id);
          
          if (agendamento) {
            console.log('✅ Agendamento carregado:', {
              tipo: agendamento.tipo_pedido,
              status: agendamento.status_agendamento,
              itens: agendamento.itens_personalizados,
              quantidade: agendamento.quantidade_total,
              data_original: agendamento.data_proxima_reposicao
            });
            
            setStatusAgendamento(agendamento.status_agendamento);
            
            // CORREÇÃO: Formatação segura da data preservando o valor exato
            if (agendamento.data_proxima_reposicao) {
              const dataFormatada = formatDateForInput(agendamento.data_proxima_reposicao);
              console.log('📅 Data formatada para input no cliente (CORRIGIDA):', {
                original: agendamento.data_proxima_reposicao,
                formatada: dataFormatada,
                dia_original: agendamento.data_proxima_reposicao.getDate(),
                mes_original: agendamento.data_proxima_reposicao.getMonth() + 1,
                ano_original: agendamento.data_proxima_reposicao.getFullYear()
              });
              setProximaDataReposicao(dataFormatada);
            } else {
              setProximaDataReposicao('');
            }
            
            setQuantidadeTotal(agendamento.quantidade_total);
            setTipoPedido(agendamento.tipo_pedido);
            
            if (agendamento.tipo_pedido === 'Alterado' && agendamento.itens_personalizados) {
              console.log('🎯 Carregando itens personalizados:', agendamento.itens_personalizados);
              setProdutosQuantidades(agendamento.itens_personalizados);
            }
          } else {
            console.log('⚠️ Nenhum agendamento encontrado, usando valores padrão');
            setStatusAgendamento('Agendar');
            setTipoPedido('Padrão');
            setQuantidadeTotal(cliente.quantidadePadrao || 0);
            setProximaDataReposicao('');
            setProdutosQuantidades([]);
          }
          setAgendamentoCarregado(true);
        } catch (error) {
          console.error('❌ Erro ao carregar agendamento:', error);
          setStatusAgendamento('Agendar');
          setTipoPedido('Padrão');
          setQuantidadeTotal(cliente.quantidadePadrao || 0);
          setProximaDataReposicao('');
          setProdutosQuantidades([]);
          setAgendamentoCarregado(true);
        }
      }
    };

    carregarDados();
  }, [cliente?.id, carregarAgendamentoPorCliente, agendamentoCarregado]);

  const somaQuantidadesProdutos = produtosQuantidades.reduce((soma, produto) => soma + produto.quantidade, 0);
  const hasValidationError = tipoPedido === 'Alterado' && somaQuantidadesProdutos !== quantidadeTotal;
  const isDataObrigatoria = statusAgendamento === 'Previsto' || statusAgendamento === 'Agendado';
  const hasDataError = isDataObrigatoria && !proximaDataReposicao;

  const atualizarQuantidadeProduto = (produtoNome: string, novaQuantidade: number) => {
    console.log('🔄 Atualizando quantidade do produto:', produtoNome, 'para:', novaQuantidade);
    setProdutosQuantidades(prev => {
      const updated = prev.map(produto => 
        produto.produto === produtoNome 
          ? { ...produto, quantidade: Math.max(0, novaQuantidade) }
          : produto
      );
      console.log('✅ Produtos atualizados:', updated);
      return updated;
    });
  };

  // Salvar alterações na tabela agendamentos_clientes
  const handleSalvar = async () => {
    if (hasValidationError) {
      toast({
        title: "Erro de validação",
        description: "A soma das quantidades dos produtos deve ser igual ao total do pedido",
        variant: "destructive"
      });
      return;
    }

    if (hasDataError) {
      toast({
        title: "Erro de validação",
        description: "Data da próxima reposição é obrigatória para status 'Previsto' ou 'Agendado'",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // CORREÇÃO: Conversão segura da data preservando o valor exato
      let dataParaBanco: Date | undefined;
      if (proximaDataReposicao) {
        dataParaBanco = parseDateFromInput(proximaDataReposicao);
        console.log('💾 Data sendo salva no cliente (CORRIGIDA):', {
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

      console.log('💾 Salvando agendamento do cliente:', {
        cliente: cliente.nome,
        dados: dadosAgendamento,
        data_input: proximaDataReposicao
      });

      await salvarAgendamento(cliente.id, dadosAgendamento);
      
      console.log('🔄 Recarregando lista de clientes...');
      await carregarClientes();
      
      if (onAgendamentoUpdate) {
        onAgendamentoUpdate();
      }

      toast({
        title: "Sucesso",
        description: "Agendamento salvo com sucesso",
      });
      
    } catch (error) {
      console.error('❌ Erro ao salvar agendamento:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar agendamento",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!agendamentoCarregado) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">Carregando agendamento...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status do Agendamento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Status do Agendamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
                  console.log('📅 Data alterada no input do cliente (CORRIGIDA):', e.target.value);
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
        </CardContent>
      </Card>

      {/* Configurações de Reposição */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações de Reposição</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
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

          {tipoPedido === 'Alterado' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Quantidades por Produto</Label>
                <div className="text-sm text-muted-foreground">
                  Total: {somaQuantidadesProdutos} / {quantidadeTotal}
                </div>
              </div>

              {cliente.categoriasHabilitadas && cliente.categoriasHabilitadas.length > 0 && (
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
                    const quantidadeAtual = produtoQuantidade?.quantidade || 0;
                    
                    return (
                      <div key={produto.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex flex-col">
                          <span className="font-medium">{produto.nome}</span>
                          {produto.categoria && (
                            <span className="text-xs text-muted-foreground">
                              Categoria: {produto.categoria}
                            </span>
                          )}
                        </div>
                        <Input
                          type="number"
                          value={quantidadeAtual}
                          onChange={(e) => {
                            const novaQuantidade = Number(e.target.value);
                            console.log('🎯 Input alterado para produto:', produto.nome, 'nova quantidade:', novaQuantidade);
                            atualizarQuantidadeProduto(produto.nome, novaQuantidade);
                          }}
                          min="0"
                          className="w-20"
                          placeholder="0"
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end pt-4">
            <Button 
              onClick={handleSalvar}
              disabled={isLoading || loading || hasValidationError || hasDataError}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {(isLoading || loading) ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
