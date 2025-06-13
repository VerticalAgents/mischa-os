
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Calendar } from "lucide-react";
import { format, addDays, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAgendamentoClienteStore } from "@/hooks/useAgendamentoClienteStore";
import { useSupabaseProdutos } from "@/hooks/useSupabaseProdutos";
import { useProporoesPadrao } from "@/hooks/useProporoesPadrao";

interface NecessidadeDiaria {
  data: Date;
  produtosPorData: Record<string, number>;
}

interface AuditoriaItem {
  clienteNome: string;
  statusAgendamento: string;
  dataReposicao: Date;
  statusCliente: string;
  quantidadesPorProduto: Record<string, number>;
}

export default function NecessidadeDiariaTab() {
  const [incluirPrevistos, setIncluirPrevistos] = useState(false);
  const [necessidadeDiaria, setNecessidadeDiaria] = useState<NecessidadeDiaria[]>([]);
  const [dadosAuditoria, setDadosAuditoria] = useState<AuditoriaItem[]>([]);
  const [produtosAtivos, setProdutosAtivos] = useState<string[]>([]);

  const { agendamentos, carregarTodosAgendamentos, carregarAgendamentoPorCliente } = useAgendamentoClienteStore();
  const { produtos } = useSupabaseProdutos();
  const { calcularQuantidadesPorProporcao, temProporcoesConfiguradas } = useProporoesPadrao();

  // Gerar array de 15 dias a partir de hoje
  const proximosQuinzeDias = Array.from({ length: 15 }, (_, i) => addDays(new Date(), i));

  // Carregar agendamentos ao montar o componente
  useEffect(() => {
    carregarTodosAgendamentos();
  }, [carregarTodosAgendamentos]);

  // Atualizar lista de produtos ativos
  useEffect(() => {
    const produtosAtivosLista = produtos
      .filter(produto => produto.ativo)
      .map(produto => produto.nome)
      .sort();
    setProdutosAtivos(produtosAtivosLista);
  }, [produtos]);

  // Processar dados de auditoria
  useEffect(() => {
    processarDadosAuditoria();
  }, [agendamentos, produtos, calcularQuantidadesPorProporcao, temProporcoesConfiguradas]);

  // Calcular necessidade diária baseada nos dados da auditoria
  useEffect(() => {
    calcularNecessidadeDiaria();
  }, [dadosAuditoria, incluirPrevistos]);

  const processarDadosAuditoria = async () => {
    console.log('🔍 Processando dados de auditoria para necessidade diária...');

    const hoje = new Date();
    const quinzeDiasFrente = addDays(hoje, 14);

    // Filtrar agendamentos para os próximos 15 dias
    const agendamentosFiltrados = agendamentos.filter(agendamento => {
      const dataReposicao = new Date(agendamento.dataReposicao);
      
      // Filtro por período (próximos 15 dias)
      const dentroPeríodo = dataReposicao >= hoje && dataReposicao <= quinzeDiasFrente;
      
      // Filtrar apenas clientes ativos
      const clienteAtivo = agendamento.cliente.statusCliente === 'Ativo';
      
      return dentroPeríodo && clienteAtivo;
    });

    console.log('📋 Agendamentos filtrados (15 dias):', agendamentosFiltrados.length);

    // Processar cada agendamento (mesma lógica da AuditoriaPCPTab)
    const dadosProcessados: AuditoriaItem[] = [];
    
    for (const agendamento of agendamentosFiltrados) {
      const quantidadesPorProduto: Record<string, number> = {};
      
      // Inicializar todas as quantidades como 0
      produtosAtivos.forEach(nomeProduto => {
        quantidadesPorProduto[nomeProduto] = 0;
      });

      console.log(`\n📦 Processando agendamento: ${agendamento.cliente.nome}`);

      try {
        const agendamentoCompleto = await carregarAgendamentoPorCliente(agendamento.cliente.id);
        
        if (agendamentoCompleto) {
          if (agendamentoCompleto.tipo_pedido === 'Alterado' && 
              agendamentoCompleto.itens_personalizados && 
              agendamentoCompleto.itens_personalizados.length > 0) {
            
            // Para pedidos alterados, usar os itens personalizados salvos
            agendamentoCompleto.itens_personalizados.forEach(item => {
              if (quantidadesPorProduto.hasOwnProperty(item.produto)) {
                quantidadesPorProduto[item.produto] = item.quantidade;
              }
            });
          } else if (agendamentoCompleto.tipo_pedido === 'Padrão') {
            // Para pedidos padrão, calcular usando as proporções
            const quantidadeTotal = agendamentoCompleto.quantidade_total;
            
            if (quantidadeTotal > 0 && temProporcoesConfiguradas()) {
              try {
                const quantidadesCalculadas = await calcularQuantidadesPorProporcao(quantidadeTotal);
                
                quantidadesCalculadas.forEach(item => {
                  if (quantidadesPorProduto.hasOwnProperty(item.produto)) {
                    quantidadesPorProduto[item.produto] = item.quantidade;
                  }
                });
              } catch (error) {
                console.error('❌ Erro ao calcular quantidades por proporção:', error);
              }
            }
          }
        } else {
          // Fallback para dados da lista de agendamentos
          if (agendamento.pedido && 
              agendamento.pedido.tipoPedido === 'Alterado' && 
              agendamento.pedido.itensPedido && 
              agendamento.pedido.itensPedido.length > 0) {
            
            agendamento.pedido.itensPedido.forEach(item => {
              const nomeProduto = item.nomeSabor || (item.sabor && item.sabor.nome);
              const quantidade = item.quantidadeSabor || 0;
              
              if (nomeProduto && quantidade > 0) {
                if (quantidadesPorProduto.hasOwnProperty(nomeProduto)) {
                  quantidadesPorProduto[nomeProduto] = quantidade;
                }
              }
            });
          } else {
            // Para agendamentos padrão, usar a quantidade total do cliente
            const quantidadeTotal = agendamento.cliente.quantidadePadrao || 0;
            
            if (quantidadeTotal > 0 && temProporcoesConfiguradas()) {
              try {
                const quantidadesCalculadas = await calcularQuantidadesPorProporcao(quantidadeTotal);
                
                quantidadesCalculadas.forEach(item => {
                  if (quantidadesPorProduto.hasOwnProperty(item.produto)) {
                    quantidadesPorProduto[item.produto] = item.quantidade;
                  }
                });
              } catch (error) {
                console.error('❌ Erro ao calcular quantidades por proporção (fallback):', error);
                if (produtosAtivos.length > 0) {
                  const primeiroProduto = produtosAtivos[0];
                  quantidadesPorProduto[primeiroProduto] = quantidadeTotal;
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('❌ Erro ao processar agendamento:', error);
      }

      dadosProcessados.push({
        clienteNome: agendamento.cliente.nome,
        statusAgendamento: agendamento.statusAgendamento,
        dataReposicao: agendamento.dataReposicao,
        statusCliente: agendamento.cliente.statusCliente || 'Ativo',
        quantidadesPorProduto
      });
    }

    console.log('✅ Dados de auditoria processados:', dadosProcessados.length);
    setDadosAuditoria(dadosProcessados);
  };

  const calcularNecessidadeDiaria = () => {
    console.log('🧮 Calculando necessidade diária...');

    // Filtrar dados de auditoria por status do agendamento
    const dadosFiltrados = dadosAuditoria.filter(item => {
      if (incluirPrevistos) {
        return item.statusAgendamento === 'Agendado' || item.statusAgendamento === 'Previsto';
      } else {
        return item.statusAgendamento === 'Agendado';
      }
    });

    console.log('📊 Dados filtrados por status:', dadosFiltrados.length);

    // Calcular necessidade por data
    const necessidadePorData: NecessidadeDiaria[] = proximosQuinzeDias.map(data => {
      const produtosPorData: Record<string, number> = {};
      
      // Inicializar todos os produtos com 0
      produtosAtivos.forEach(nomeProduto => {
        produtosPorData[nomeProduto] = 0;
      });

      // Somar quantidades dos agendamentos nesta data
      dadosFiltrados.forEach(item => {
        const dataReposicao = new Date(item.dataReposicao);
        
        if (dataReposicao.toDateString() === data.toDateString()) {
          Object.keys(item.quantidadesPorProduto).forEach(nomeProduto => {
            const quantidade = item.quantidadesPorProduto[nomeProduto] || 0;
            if (produtosPorData.hasOwnProperty(nomeProduto)) {
              produtosPorData[nomeProduto] += quantidade;
            }
          });
        }
      });

      return {
        data,
        produtosPorData
      };
    });

    console.log('✅ Necessidade diária calculada:', necessidadePorData);
    setNecessidadeDiaria(necessidadePorData);
  };

  const totalPorProduto = (nomeProduto: string) => {
    return necessidadeDiaria.reduce((sum, dia) => sum + (dia.produtosPorData[nomeProduto] || 0), 0);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Necessidade Diária de Produção (15 dias)
          </CardTitle>
          <CardDescription>
            Visualização da necessidade de produção por sabor nos próximos 15 dias baseada nos dados da Auditoria PCP
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                id="incluir-previstos"
                checked={incluirPrevistos}
                onCheckedChange={setIncluirPrevistos}
              />
              <Label htmlFor="incluir-previstos">Incluir pedidos previstos</Label>
            </div>

            <div className="text-sm text-muted-foreground">
              Dados baseados na Auditoria PCP | Produtos ativos: {produtosAtivos.length}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Necessidade por Sabor */}
      <Card>
        <CardHeader>
          <CardTitle>Necessidade por Sabor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <TooltipProvider>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-background min-w-[150px]">Sabor</TableHead>
                    {proximosQuinzeDias.map((data, index) => (
                      <TableHead key={index} className="text-center min-w-[60px]">
                        <div className="text-xs">
                          <div>{format(data, 'dd/MM')}</div>
                          <div className="text-muted-foreground">
                            {format(data, 'EEE', { locale: ptBR }).substring(0, 3)}
                          </div>
                        </div>
                      </TableHead>
                    ))}
                    <TableHead className="text-center font-medium">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {produtosAtivos.map(nomeProduto => (
                    <TableRow key={nomeProduto}>
                      <TableCell className="sticky left-0 bg-background font-medium">
                        {nomeProduto}
                      </TableCell>
                      {necessidadeDiaria.map((dia, index) => {
                        const quantidade = dia.produtosPorData[nomeProduto] || 0;
                        const isHoje = isToday(dia.data);
                        
                        return (
                          <Tooltip key={index}>
                            <TooltipTrigger asChild>
                              <TableCell 
                                className={`text-center cursor-help ${
                                  quantidade > 0 
                                    ? 'font-medium text-green-800' 
                                    : 'text-gray-400'
                                } ${isHoje ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}
                              >
                                {quantidade}
                              </TableCell>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="text-sm">
                                <div className="font-medium">{format(dia.data, "dd 'de' MMMM", { locale: ptBR })}</div>
                                <div>{nomeProduto}: {quantidade} unidades</div>
                                {isHoje && <div className="text-blue-600 font-medium">📅 Hoje</div>}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                      <TableCell className="text-center font-bold bg-muted">
                        {totalPorProduto(nomeProduto)}
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {/* Linha de totais por dia */}
                  <TableRow className="bg-muted/50 font-medium">
                    <TableCell className="sticky left-0 bg-muted/50">Total por dia</TableCell>
                    {necessidadeDiaria.map((dia, index) => {
                      const totalDia = Object.values(dia.produtosPorData).reduce((sum, qty) => sum + qty, 0);
                      return (
                        <TableCell key={index} className={`text-center ${isToday(dia.data) ? 'ring-2 ring-blue-500' : ''}`}>
                          {totalDia}
                        </TableCell>
                      );
                    })}
                    <TableCell className="text-center font-bold">
                      {necessidadeDiaria.reduce((sum, dia) => 
                        sum + Object.values(dia.produtosPorData).reduce((daySum, qty) => daySum + qty, 0), 0
                      )}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>

      {/* Legenda */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
              <span>Com necessidade de produção</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded"></div>
              <span className="text-gray-400">Sem necessidade (0 unidades)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-50 border-2 border-blue-500 rounded"></div>
              <span>Hoje</span>
            </div>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            Dados baseados nos agendamentos filtrados da Auditoria PCP para os próximos 15 dias
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
