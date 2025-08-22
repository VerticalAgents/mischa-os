
import { useState, useEffect } from 'react';
import { Cliente } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAgendamentoClienteStore } from "@/hooks/useAgendamentoClienteStore";
import { useClienteStore } from "@/hooks/useClienteStore";
import { toast } from "@/hooks/use-toast";
import { AlertTriangle, Save, Calendar } from "lucide-react";
import ProdutoQuantidadeSelector from '@/components/agendamento/ProdutoQuantidadeSelector';

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
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseDateFromInput = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
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
  
  const { carregarAgendamentoPorCliente, salvarAgendamento, loading } = useAgendamentoClienteStore();
  const { carregarClientes } = useClienteStore();

  // Carregar dados do agendamento
  useEffect(() => {
    const carregarDados = async () => {
      if (!agendamentoCarregado) {
        setIsLoading(true);
        try {
          console.log('🔄 Carregando agendamento para cliente:', cliente.id);
          const agendamento = await carregarAgendamentoPorCliente(cliente.id);
          
          if (agendamento) {
            console.log('✅ Agendamento carregado:', agendamento);
            setStatusAgendamento(agendamento.status_agendamento);
            setTipoPedido(agendamento.tipo_pedido);
            setQuantidadeTotal(agendamento.quantidade_total);
            
            if (agendamento.data_proxima_reposicao) {
              setProximaDataReposicao(formatDateForInput(agendamento.data_proxima_reposicao));
            }
            
            if (agendamento.tipo_pedido === 'Alterado' && agendamento.itens_personalizados) {
              console.log('📦 Carregando itens personalizados:', agendamento.itens_personalizados);
              setProdutosQuantidades(agendamento.itens_personalizados);
            }
          } else {
            // Usar dados padrão do cliente
            setQuantidadeTotal(cliente.quantidadePadrao);
            if (cliente.proximaDataReposicao) {
              setProximaDataReposicao(formatDateForInput(cliente.proximaDataReposicao));
            }
          }
        } catch (error) {
          console.error('❌ Erro ao carregar agendamento:', error);
        } finally {
          setIsLoading(false);
          setAgendamentoCarregado(true);
        }
      }
    };

    carregarDados();
  }, [cliente, carregarAgendamentoPorCliente, agendamentoCarregado]);

  // Limpar produtos quando tipo muda para Padrão
  useEffect(() => {
    if (tipoPedido === 'Padrão') {
      setProdutosQuantidades([]);
    }
  }, [tipoPedido]);

  // NOVA FUNCIONALIDADE: Limpar data automaticamente quando status for "Agendar"
  useEffect(() => {
    if (statusAgendamento === 'Agendar') {
      console.log('🗓️ Status alterado para "Agendar" - limpando data automaticamente');
      setProximaDataReposicao('');
    }
  }, [statusAgendamento]);

  const somaQuantidadesProdutos = produtosQuantidades.reduce((soma, produto) => soma + produto.quantidade, 0);
  const hasValidationError = tipoPedido === "Alterado" && somaQuantidadesProdutos !== quantidadeTotal;

  const handleSalvar = async () => {
    // NOVA VALIDAÇÃO: Permitir data vazia apenas quando status for "Agendar"
    if (statusAgendamento !== 'Agendar' && !proximaDataReposicao) {
      toast({
        title: "Data obrigatória",
        description: "Data de reposição é obrigatória para status 'Previsto' ou 'Agendado'",
        variant: "destructive"
      });
      return;
    }

    if (hasValidationError) {
      toast({
        title: "Erro de validação",
        description: "A soma das quantidades dos produtos deve ser igual ao total do pedido",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // CORREÇÃO: Forçar data como null quando status for "Agendar" ou data estiver vazia
      let dataReposicao = null;
      if (statusAgendamento !== 'Agendar' && proximaDataReposicao && proximaDataReposicao.trim() !== '') {
        dataReposicao = parseDateFromInput(proximaDataReposicao);
      }
      
      // Log detalhado dos dados que serão enviados
      const dadosParaSalvar = {
        status_agendamento: statusAgendamento,
        data_proxima_reposicao: dataReposicao, // Sempre será null para status "Agendar" ou Date se preenchido
        tipo_pedido: tipoPedido,
        quantidade_total: quantidadeTotal,
        itens_personalizados: tipoPedido === "Alterado" ? produtosQuantidades : null
      };
      
      console.log('🚀 AgendamentoAtual - Salvando dados:', {
        clienteId: cliente.id,
        statusAgendamento,
        tipoPedido,
        quantidadeTotal,
        proximaDataReposicaoInput: proximaDataReposicao,
        dataReposicao,
        dadosCompletos: dadosParaSalvar
      });
      
      await salvarAgendamento(cliente.id, dadosParaSalvar);

      toast({
        title: "Sucesso",
        description: statusAgendamento === 'Agendar' || !dataReposicao 
          ? "Agendamento salvo sem data definida" 
          : "Agendamento salvo com sucesso"
      });

      // Recarregar lista de clientes para atualizar status
      await carregarClientes();
      onAgendamentoUpdate?.();
    } catch (error) {
      console.error('❌ AgendamentoAtual - Erro ao salvar agendamento:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar agendamento",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !agendamentoCarregado) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Carregando dados do agendamento...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Agendamento Atual
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Status do Agendamento</Label>
            <RadioGroup value={statusAgendamento} onValueChange={(value: any) => setStatusAgendamento(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Agendar" id="agendar" />
                <Label htmlFor="agendar">Agendar</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Previsto" id="previsto" />
                <Label htmlFor="previsto">Previsto</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Agendado" id="agendado" />
                <Label htmlFor="agendado">Agendado</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>Tipo do Pedido</Label>
            <RadioGroup value={tipoPedido} onValueChange={(value: any) => setTipoPedido(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Padrão" id="padrao" />
                <Label htmlFor="padrao">Padrão</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Alterado" id="alterado" />
                <Label htmlFor="alterado">Alterado</Label>
              </div>
            </RadioGroup>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="dataReposicao">
            Data de Reposição
            {statusAgendamento === 'Agendar' && (
              <span className="text-sm text-muted-foreground ml-2">(será limpa automaticamente)</span>
            )}
          </Label>
          <Input
            id="dataReposicao"
            type="date"
            value={proximaDataReposicao}
            onChange={(e) => setProximaDataReposicao(e.target.value)}
            disabled={statusAgendamento === 'Agendar'}
          />
          {statusAgendamento === 'Agendar' && (
            <p className="text-sm text-blue-600">
              Para status "Agendar", a data será automaticamente limpa
            </p>
          )}
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
              value={produtosQuantidades}
              onChange={setProdutosQuantidades}
              clienteId={cliente.id}
              quantidadeTotal={quantidadeTotal}
            />
          </div>
        )}

        <Button 
          onClick={handleSalvar} 
          className="w-full" 
          disabled={isLoading || hasValidationError}
        >
          <Save className="h-4 w-4 mr-2" />
          {isLoading ? 'Salvando...' : 'Salvar Agendamento'}
        </Button>
      </CardContent>
    </Card>
  );
}
