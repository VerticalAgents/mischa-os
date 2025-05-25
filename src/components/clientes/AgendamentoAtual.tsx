
import { useState, useEffect } from 'react';
import { Cliente } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useClienteStore } from "@/hooks/useClienteStore";
import { useProdutoStore } from "@/hooks/useProdutoStore";
import { toast } from "@/hooks/use-toast";
import { AlertTriangle, Save, Calendar } from "lucide-react";

interface AgendamentoAtualProps {
  cliente: Cliente;
}

interface ProdutoQuantidade {
  produto_id: number;
  nome_produto: string;
  quantidade: number;
}

export default function AgendamentoAtual({ cliente }: AgendamentoAtualProps) {
  const [statusAgendamento, setStatusAgendamento] = useState(cliente.statusAgendamento || 'Agendar');
  const [proximaDataReposicao, setProximaDataReposicao] = useState(
    cliente.proximaDataReposicao ? cliente.proximaDataReposicao.toISOString().split('T')[0] : ''
  );
  const [quantidadeTotal, setQuantidadeTotal] = useState(cliente.quantidadePadrao);
  const [periodicidade, setPeriodicidade] = useState(cliente.periodicidadePadrao);
  const [tipoPedido, setTipoPedido] = useState<'Padrão' | 'Alterado'>('Padrão');
  const [produtosQuantidades, setProdutosQuantidades] = useState<ProdutoQuantidade[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const { atualizarCliente } = useClienteStore();
  const { produtos } = useProdutoStore();

  // Filtrar produtos baseado nas categorias habilitadas do cliente
  const produtosFiltrados = produtos.filter(produto => {
    if (!cliente.categoriasHabilitadas || cliente.categoriasHabilitadas.length === 0) {
      return true; // Se não há categorias específicas, mostrar todos
    }
    return cliente.categoriasHabilitadas.includes(produto.categoriaId);
  });

  // Inicializar produtos com quantidades quando o tipo for "Alterado"
  useEffect(() => {
    if (tipoPedido === 'Alterado' && produtosFiltrados.length > 0) {
      const produtosIniciais = produtosFiltrados.map(produto => ({
        produto_id: produto.id,
        nome_produto: produto.nome,
        quantidade: 0
      }));
      setProdutosQuantidades(produtosIniciais);
    }
  }, [tipoPedido, produtosFiltrados.length]);

  // Calcular soma das quantidades dos produtos
  const somaQuantidadesProdutos = produtosQuantidades.reduce((soma, produto) => soma + produto.quantidade, 0);
  
  // Verificar se há erro de validação
  const hasValidationError = tipoPedido === 'Alterado' && somaQuantidadesProdutos !== quantidadeTotal;

  // Verificar se data é obrigatória
  const isDataObrigatoria = statusAgendamento === 'Previsto' || statusAgendamento === 'Agendado';
  const hasDataError = isDataObrigatoria && !proximaDataReposicao;

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
  const atualizarQuantidadeProduto = (produtoId: number, novaQuantidade: number) => {
    setProdutosQuantidades(prev => 
      prev.map(produto => 
        produto.produto_id === produtoId 
          ? { ...produto, quantidade: Math.max(0, novaQuantidade) }
          : produto
      )
    );
  };

  // Salvar alterações
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
      const dadosAtualizacao: Partial<Cliente> = {
        quantidadePadrao: quantidadeTotal,
        periodicidadePadrao: periodicidade,
        statusAgendamento,
        proximaDataReposicao: proximaDataReposicao ? new Date(proximaDataReposicao) : undefined
      };

      await atualizarCliente(cliente.id, dadosAtualizacao);
      
      toast({
        title: "Agendamento atualizado",
        description: "As configurações de agendamento foram salvas com sucesso"
      });
    } catch (error) {
      console.error('Erro ao salvar agendamento:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as alterações",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

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
              <Select value={statusAgendamento} onValueChange={setStatusAgendamento}>
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
        </CardContent>
      </Card>

      {/* Configurações de Reposição */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações de Reposição</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Quantidade Total */}
          <div className="space-y-2">
            <Label htmlFor="quantidade-total">Quantidade Total do Pedido</Label>
            <Input
              id="quantidade-total"
              type="number"
              value={quantidadeTotal}
              onChange={(e) => setQuantidadeTotal(Number(e.target.value))}
              min="1"
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
              onValueChange={(value) => setTipoPedido(value as 'Padrão' | 'Alterado')}
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
                  {produtosQuantidades.map((produto) => {
                    const produtoInfo = produtosFiltrados.find(p => p.id === produto.produto_id);
                    return (
                      <div key={produto.produto_id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex flex-col">
                          <span className="font-medium">{produto.nome_produto}</span>
                          {produtoInfo?.categoria && (
                            <span className="text-xs text-muted-foreground">
                              Categoria: {produtoInfo.categoria}
                            </span>
                          )}
                        </div>
                        <Input
                          type="number"
                          value={produto.quantidade}
                          onChange={(e) => atualizarQuantidadeProduto(produto.produto_id, Number(e.target.value))}
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

          {/* Botão Salvar */}
          <div className="flex justify-end pt-4">
            <Button 
              onClick={handleSalvar}
              disabled={isLoading || hasValidationError || hasDataError}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isLoading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
