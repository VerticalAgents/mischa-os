import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Calculator, Info, Eye, EyeOff } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import { useClienteStore } from "@/hooks/useClienteStore";
import { useSupabaseCategoriasProduto } from "@/hooks/useSupabaseCategoriasProduto";
import { useEffect, useState } from "react";

// Preços temporários por categoria
const PRECOS_TEMPORARIOS: Record<string, number> = {
  'revenda padrão': 4.50,
  'food service': 70.00,
  'default': 5.00
};

// Custos diferenciados por categoria
const CUSTOS_UNITARIOS: Record<string, number> = {
  'revenda padrão': 1.32,
  'food service': 29.17,
  'default': 1.32
};

const ALIQUOTA_PROVISORIA = 0.04; // 4%

interface ProjecaoCliente {
  clienteId: string;
  nomeCliente: string;
  categorias: {
    categoriaId: number;
    nomeCategoria: string;
    giroSemanal: number;
    precoAplicado: number;
    faturamento: number;
    custoInsumos: number;
    margemUnitaria: number;
    custoUnitario: number;
  }[];
  emiteNotaFiscal: boolean;
  impostoTotal: number;
  tipoLogistica: string;
  percentualLogistico: number;
  custoLogistico: number;
  lucroBruto: number;
}

interface CalculoDetalhe {
  etapa: string;
  descricao: string;
  valor?: number;
  formula?: string;
  observacao?: string;
}

interface ClienteDetalhe {
  clienteId: string;
  nomeCliente: string;
  calculos: CalculoDetalhe[];
}

interface ClienteNaoIncluido {
  nomeCliente: string;
  motivo: string;
}

export default function ProjecaoResultadosPDV() {
  const { clientes, carregarClientes } = useClienteStore();
  const { categorias } = useSupabaseCategoriasProduto();
  const [projecoes, setProjecoes] = useState<ProjecaoCliente[]>([]);
  const [mostrarDetalhes, setMostrarDetalhes] = useState(false);
  const [detalhesCalculos, setDetalhesCalculos] = useState<ClienteDetalhe[]>([]);
  const [clientesNaoIncluidos, setClientesNaoIncluidos] = useState<ClienteNaoIncluido[]>([]);

  useEffect(() => {
    console.log('ProjecaoResultadosPDV: Carregando clientes...');
    carregarClientes();
  }, [carregarClientes]);

  useEffect(() => {
    console.log('ProjecaoResultadosPDV: Total de clientes carregados:', clientes.length);
    console.log('ProjecaoResultadosPDV: Categorias disponíveis:', categorias.length);
    
    if (clientes.length > 0 && categorias.length > 0) {
      calcularProjecoes();
    }
  }, [clientes, categorias]);

  const obterPrecoCategoria = (nomeCategoria: string): number => {
    const nomeNormalizado = nomeCategoria.toLowerCase();
    for (const [key, preco] of Object.entries(PRECOS_TEMPORARIOS)) {
      if (nomeNormalizado.includes(key)) {
        return preco;
      }
    }
    return PRECOS_TEMPORARIOS.default;
  };

  const obterCustoCategoria = (nomeCategoria: string): number => {
    const nomeNormalizado = nomeCategoria.toLowerCase();
    for (const [key, custo] of Object.entries(CUSTOS_UNITARIOS)) {
      if (nomeNormalizado.includes(key)) {
        return custo;
      }
    }
    return CUSTOS_UNITARIOS.default;
  };

  const calcularGiroSemanal = (qtdPadrao: number, periodicidade: number): number => {
    if (periodicidade === 0) return 0;
    return Math.round((qtdPadrao / periodicidade) * 7);
  };

  const calcularProjecoes = () => {
    console.log('ProjecaoResultadosPDV: Iniciando cálculo de projeções...');
    
    // Filtrar apenas clientes ativos
    const clientesAtivos = clientes.filter(cliente => cliente.statusCliente === 'Ativo');
    console.log('ProjecaoResultadosPDV: Clientes ativos encontrados:', clientesAtivos.length);
    
    const projecoesCalculadas: ProjecaoCliente[] = [];
    const detalhesCalculados: ClienteDetalhe[] = [];
    const clientesExcluidos: ClienteNaoIncluido[] = [];

    clientesAtivos.forEach(cliente => {
      const detalhesCliente: CalculoDetalhe[] = [];
      
      // Verificar se cliente tem categorias habilitadas
      if (!cliente.categoriasHabilitadas || cliente.categoriasHabilitadas.length === 0) {
        console.log(`ProjecaoResultadosPDV: Cliente ${cliente.nome} sem categorias habilitadas`);
        
        clientesExcluidos.push({
          nomeCliente: cliente.nome,
          motivo: "Cliente sem categorias habilitadas"
        });
        
        detalhesCliente.push({
          etapa: "AVISO",
          descricao: "Cliente sem categorias habilitadas - pulando cálculos",
          observacao: "Para incluir este cliente na projeção, configure as categorias habilitadas no cadastro"
        });
        
        detalhesCalculados.push({
          clienteId: cliente.id,
          nomeCliente: cliente.nome,
          calculos: detalhesCliente
        });
        return;
      }

      detalhesCliente.push({
        etapa: "DADOS_BASE",
        descricao: "Dados básicos do cliente",
        observacao: `Quantidade padrão: ${cliente.quantidadePadrao}, Periodicidade: ${cliente.periodicidadePadrao} dias, Categorias habilitadas: ${cliente.categoriasHabilitadas.length}`
      });

      const categoriasCliente = cliente.categoriasHabilitadas.map(categoriaId => {
        const categoria = categorias.find(cat => cat.id === categoriaId);
        if (!categoria) {
          detalhesCliente.push({
            etapa: "ERRO_CATEGORIA",
            descricao: `Categoria ID ${categoriaId} não encontrada`,
            observacao: "Esta categoria pode ter sido removida do sistema"
          });
          return null;
        }

        const giroSemanal = calcularGiroSemanal(cliente.quantidadePadrao, cliente.periodicidadePadrao);
        const precoAplicado = obterPrecoCategoria(categoria.nome);
        const custoUnitario = obterCustoCategoria(categoria.nome);
        const faturamento = giroSemanal * precoAplicado;
        const custoInsumos = giroSemanal * custoUnitario;
        const margemUnitaria = precoAplicado - custoUnitario;

        detalhesCliente.push({
          etapa: "CALCULO_CATEGORIA",
          descricao: `Cálculos para categoria: ${categoria.nome}`,
          formula: `Giro semanal = (${cliente.quantidadePadrao} ÷ ${cliente.periodicidadePadrao}) × 7 = ${giroSemanal}`,
          observacao: `Preço aplicado: R$ ${precoAplicado.toFixed(2)} | Custo unitário: R$ ${custoUnitario.toFixed(2)} (${categoria.nome.toLowerCase().includes('food service') ? 'custo Food Service' : 'custo padrão'})`
        });

        detalhesCliente.push({
          etapa: "FATURAMENTO",
          descricao: `Faturamento da categoria ${categoria.nome}`,
          formula: `${giroSemanal} × R$ ${precoAplicado.toFixed(2)} = R$ ${faturamento.toFixed(2)}`,
          valor: faturamento
        });

        detalhesCliente.push({
          etapa: "CUSTO_INSUMOS",
          descricao: `Custo de insumos da categoria ${categoria.nome}`,
          formula: `${giroSemanal} × R$ ${custoUnitario.toFixed(2)} = R$ ${custoInsumos.toFixed(2)}`,
          valor: custoInsumos
        });

        detalhesCliente.push({
          etapa: "MARGEM_UNITARIA",
          descricao: `Margem unitária da categoria ${categoria.nome}`,
          formula: `R$ ${precoAplicado.toFixed(2)} - R$ ${custoUnitario.toFixed(2)} = R$ ${margemUnitaria.toFixed(2)}`,
          valor: margemUnitaria
        });

        return {
          categoriaId,
          nomeCategoria: categoria.nome,
          giroSemanal,
          precoAplicado,
          faturamento,
          custoInsumos,
          margemUnitaria,
          custoUnitario
        };
      }).filter(Boolean) as any[];

      if (categoriasCliente.length === 0) {
        console.log(`ProjecaoResultadosPDV: Cliente ${cliente.nome} sem categorias válidas`);
        
        clientesExcluidos.push({
          nomeCliente: cliente.nome,
          motivo: "Categorias configuradas não encontradas no sistema"
        });
        
        detalhesCalculados.push({
          clienteId: cliente.id,
          nomeCliente: cliente.nome,
          calculos: detalhesCliente
        });
        return;
      }

      const faturamentoTotal = categoriasCliente.reduce((sum, cat) => sum + cat.faturamento, 0);
      const custoInsumosTotal = categoriasCliente.reduce((sum, cat) => sum + cat.custoInsumos, 0);
      
      detalhesCliente.push({
        etapa: "FATURAMENTO_TOTAL",
        descricao: "Faturamento total do cliente",
        formula: `Soma dos faturamentos por categoria = R$ ${faturamentoTotal.toFixed(2)}`,
        valor: faturamentoTotal
      });

      detalhesCliente.push({
        etapa: "CUSTO_TOTAL",
        descricao: "Custo total de insumos do cliente",
        formula: `Soma dos custos por categoria = R$ ${custoInsumosTotal.toFixed(2)}`,
        valor: custoInsumosTotal
      });
      
      const impostoTotal = cliente.emiteNotaFiscal ? faturamentoTotal * ALIQUOTA_PROVISORIA : 0;
      
      detalhesCliente.push({
        etapa: "IMPOSTO",
        descricao: "Cálculo de impostos",
        formula: cliente.emiteNotaFiscal 
          ? `R$ ${faturamentoTotal.toFixed(2)} × ${(ALIQUOTA_PROVISORIA * 100).toFixed(1)}% = R$ ${impostoTotal.toFixed(2)}`
          : "Cliente não emite NF - sem impostos",
        valor: impostoTotal,
        observacao: cliente.emiteNotaFiscal ? "Alíquota provisória de 4%" : "Verificar configuração de nota fiscal"
      });
      
      // Obter percentual logístico baseado no tipo
      let percentualLogistico = 0;
      if (cliente.tipoLogistica === 'Distribuição') {
        percentualLogistico = 0.08; // 8% para distribuição
      } else if (cliente.tipoLogistica === 'Própria') {
        percentualLogistico = 0.03; // 3% para logística própria
      }
      
      const custoLogistico = faturamentoTotal * percentualLogistico;
      
      detalhesCliente.push({
        etapa: "LOGISTICA",
        descricao: "Cálculo de custo logístico",
        formula: `R$ ${faturamentoTotal.toFixed(2)} × ${(percentualLogistico * 100).toFixed(1)}% = R$ ${custoLogistico.toFixed(2)}`,
        valor: custoLogistico,
        observacao: `Tipo: ${cliente.tipoLogistica || 'Própria'}`
      });
      
      const lucroBruto = faturamentoTotal - custoInsumosTotal - impostoTotal - custoLogistico;

      detalhesCliente.push({
        etapa: "LUCRO_BRUTO",
        descricao: "Lucro bruto final",
        formula: `R$ ${faturamentoTotal.toFixed(2)} - R$ ${custoInsumosTotal.toFixed(2)} - R$ ${impostoTotal.toFixed(2)} - R$ ${custoLogistico.toFixed(2)} = R$ ${lucroBruto.toFixed(2)}`,
        valor: lucroBruto,
        observacao: lucroBruto > 0 ? "Lucro positivo" : "Prejuízo ou ponto de equilíbrio"
      });

      projecoesCalculadas.push({
        clienteId: cliente.id,
        nomeCliente: cliente.nome,
        categorias: categoriasCliente,
        emiteNotaFiscal: cliente.emiteNotaFiscal || false,
        impostoTotal,
        tipoLogistica: cliente.tipoLogistica || 'Própria',
        percentualLogistico,
        custoLogistico,
        lucroBruto
      });

      detalhesCalculados.push({
        clienteId: cliente.id,
        nomeCliente: cliente.nome,
        calculos: detalhesCliente
      });
    });

    console.log('ProjecaoResultadosPDV: Projeções calculadas:', projecoesCalculadas.length);
    console.log('ProjecaoResultadosPDV: Clientes não incluídos:', clientesExcluidos.length);
    
    setProjecoes(projecoesCalculadas);
    setDetalhesCalculos(detalhesCalculados);
    setClientesNaoIncluidos(clientesExcluidos);
  };

  const formatarMoeda = (valor: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const formatarPercentual = (valor: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'percent',
      minimumFractionDigits: 1
    }).format(valor);
  };

  const totalGeral = projecoes.reduce((sum, proj) => sum + proj.lucroBruto, 0);
  const faturamentoGeral = projecoes.reduce((sum, proj) => 
    sum + proj.categorias.reduce((catSum, cat) => catSum + cat.faturamento, 0), 0
  );

  const clientesAtivos = clientes.filter(cliente => cliente.statusCliente === 'Ativo');

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Projeção de Resultados por PDV"
        description="Análise de rentabilidade e projeções por ponto de venda"
      />
      
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Info className="h-5 w-5" />
              Status do Carregamento de Dados
            </CardTitle>
            <Button
              variant={mostrarDetalhes ? "default" : "outline"}
              size="sm"
              onClick={() => setMostrarDetalhes(!mostrarDetalhes)}
            >
              {mostrarDetalhes ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {mostrarDetalhes ? "Ocultar" : "Mostrar"} Detalhes dos Cálculos
            </Button>
          </div>
        </CardHeader>
        <CardContent className="text-sm text-blue-700">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center p-3 bg-white rounded border">
              <div className="font-semibold">Total de Clientes</div>
              <div className="text-2xl font-bold text-blue-600">{clientes.length}</div>
            </div>
            <div className="text-center p-3 bg-white rounded border">
              <div className="font-semibold">Clientes Ativos</div>
              <div className="text-2xl font-bold text-green-600">{clientesAtivos.length}</div>
            </div>
            <div className="text-center p-3 bg-white rounded border">
              <div className="font-semibold">Com Categorias</div>
              <div className="text-2xl font-bold text-purple-600">
                {clientesAtivos.filter(c => c.categoriasHabilitadas && c.categoriasHabilitadas.length > 0).length}
              </div>
            </div>
            <div className="text-center p-3 bg-white rounded border">
              <div className="font-semibold">Na Projeção</div>
              <div className="text-2xl font-bold text-orange-600">{projecoes.length}</div>
            </div>
          </div>
          
          {mostrarDetalhes && (
            <div className="mt-4 space-y-4 max-h-96 overflow-y-auto">
              <h4 className="font-semibold text-blue-800">Detalhes dos Cálculos por Cliente:</h4>
              {detalhesCalculos.map((clienteDetalhe) => (
                <div key={clienteDetalhe.clienteId} className="border border-blue-200 rounded p-3 bg-white">
                  <h5 className="font-semibold text-blue-700 mb-2">{clienteDetalhe.nomeCliente}</h5>
                  <div className="space-y-2">
                    {clienteDetalhe.calculos.map((calculo, index) => (
                      <div key={index} className="text-xs">
                        <div className="font-medium text-blue-600">{calculo.etapa}: {calculo.descricao}</div>
                        {calculo.formula && (
                          <div className="text-gray-600 ml-2">📐 {calculo.formula}</div>
                        )}
                        {calculo.valor !== undefined && (
                          <div className="text-green-600 ml-2">💰 Resultado: {formatarMoeda(calculo.valor)}</div>
                        )}
                        {calculo.observacao && (
                          <div className="text-amber-600 ml-2">ℹ️ {calculo.observacao}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              
              {clientesNaoIncluidos.length > 0 && (
                <div className="border border-red-200 rounded p-3 bg-red-50">
                  <h4 className="font-semibold text-red-800 mb-3">Clientes Não Incluídos na Projeção:</h4>
                  <div className="space-y-2">
                    {clientesNaoIncluidos.map((cliente, index) => (
                      <div key={index} className="text-sm">
                        <div className="font-medium text-red-700">❌ {cliente.nomeCliente}</div>
                        <div className="text-red-600 ml-4">Motivo: {cliente.motivo}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-amber-800">
            <AlertTriangle className="h-5 w-5" />
            Projeção com dados estimados
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-amber-700">
          <p className="mb-2">
            Esta projeção utiliza valores temporários que serão parametrizados:
          </p>
          <ul className="space-y-1 list-disc list-inside">
            <li>🔧 Preços por categoria: Revenda Padrão (R$ 4,50), Food Service (R$ 70,00)</li>
            <li>🔧 Custos unitários: Revenda Padrão (R$ 1,32), Food Service (R$ 29,17)</li>
            <li>🔧 Alíquota de imposto: 4% provisório</li>
            <li>🔧 Logística: Própria (3%), Distribuição (8%)</li>
          </ul>
        </CardContent>
      </Card>

      {projecoes.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma projeção disponível</h3>
            <p className="text-muted-foreground">
              Dos {clientesAtivos.length} clientes ativos, nenhum possui categorias habilitadas para cálculo.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Resumo Geral
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Faturamento Semanal</p>
                  <p className="text-2xl font-bold text-blue-600">{formatarMoeda(faturamentoGeral)}</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Lucro Bruto Semanal</p>
                  <p className="text-2xl font-bold text-green-600">{formatarMoeda(totalGeral)}</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Margem Bruta</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {formatarPercentual(faturamentoGeral > 0 ? totalGeral / faturamentoGeral : 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Projeção Detalhada por Cliente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Giro Semanal</TableHead>
                      <TableHead>Preço Aplicado</TableHead>
                      <TableHead>Custo Unit.</TableHead>
                      <TableHead>Faturamento</TableHead>
                      <TableHead>Custo Insumos</TableHead>
                      <TableHead>Margem Unit.</TableHead>
                      <TableHead>NF</TableHead>
                      <TableHead>Imposto</TableHead>
                      <TableHead>Logística</TableHead>
                      <TableHead>Custo Log.</TableHead>
                      <TableHead>Lucro Bruto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projecoes.map((projecao) => 
                      projecao.categorias.map((categoria, index) => (
                        <TableRow key={`${projecao.clienteId}-${categoria.categoriaId}`}>
                          {index === 0 && (
                            <TableCell rowSpan={projecao.categorias.length} className="font-medium border-r">
                              {projecao.nomeCliente}
                            </TableCell>
                          )}
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {categoria.nomeCategoria}
                              <Badge variant="secondary" className="text-xs">🔧</Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">{categoria.giroSemanal}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {formatarMoeda(categoria.precoAplicado)}
                              <Badge variant="outline" className="text-xs">temp</Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {formatarMoeda(categoria.custoUnitario)}
                              <Badge variant={categoria.nomeCategoria.toLowerCase().includes('food service') ? "destructive" : "secondary"} className="text-xs">
                                {categoria.nomeCategoria.toLowerCase().includes('food service') ? 'FS' : 'std'}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{formatarMoeda(categoria.faturamento)}</TableCell>
                          <TableCell>{formatarMoeda(categoria.custoInsumos)}</TableCell>
                          <TableCell className={categoria.margemUnitaria > 0 ? "text-green-600" : "text-red-600"}>
                            {formatarMoeda(categoria.margemUnitaria)}
                          </TableCell>
                          {index === 0 && (
                            <>
                              <TableCell rowSpan={projecao.categorias.length} className="text-center border-l">
                                <Badge variant={projecao.emiteNotaFiscal ? "default" : "secondary"}>
                                  {projecao.emiteNotaFiscal ? "Sim" : "Não"}
                                </Badge>
                              </TableCell>
                              <TableCell rowSpan={projecao.categorias.length}>
                                <div className="flex items-center gap-1">
                                  {formatarMoeda(projecao.impostoTotal)}
                                  {projecao.impostoTotal > 0 && (
                                    <Badge variant="outline" className="text-xs">4%</Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell rowSpan={projecao.categorias.length}>
                                <div className="text-center">
                                  <div>{projecao.tipoLogistica}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {formatarPercentual(projecao.percentualLogistico)}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell rowSpan={projecao.categorias.length}>
                                {formatarMoeda(projecao.custoLogistico)}
                              </TableCell>
                              <TableCell rowSpan={projecao.categorias.length} className={`font-bold border-l ${projecao.lucroBruto > 0 ? "text-green-600" : "text-red-600"}`}>
                                {formatarMoeda(projecao.lucroBruto)}
                              </TableCell>
                            </>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
