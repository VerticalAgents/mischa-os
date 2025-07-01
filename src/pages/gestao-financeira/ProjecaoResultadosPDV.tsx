import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Calculator, Info, Eye, EyeOff, TrendingUp, Users, DollarSign, Percent } from "lucide-react";
import PageHeader from "@/components/common/PageHeader";
import { useClienteStore } from "@/hooks/useClienteStore";
import { useSupabaseCategoriasProduto } from "@/hooks/useSupabaseCategoriasProduto";
import { useSupabaseTiposLogistica } from "@/hooks/useSupabaseTiposLogistica";
import { useSupabasePrecosCategoriaCliente } from "@/hooks/useSupabasePrecosCategoriaCliente";
import { useConfiguracoesStore } from "@/hooks/useConfiguracoesStore";
import { useEffect, useState } from "react";

// Preços temporários por categoria (fallback)
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
    precoPersonalizado: boolean;
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
  const { tiposLogistica } = useSupabaseTiposLogistica();
  const { carregarPrecosPorCliente } = useSupabasePrecosCategoriaCliente();
  const { obterConfiguracao } = useConfiguracoesStore();
  
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
    console.log('ProjecaoResultadosPDV: Tipos de logística carregados:', tiposLogistica.length);
    if (clientes.length > 0 && categorias.length > 0 && tiposLogistica.length > 0) {
      calcularProjecoes();
    }
  }, [clientes, categorias, tiposLogistica]);

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

  const obterPrecoPorCliente = async (clienteId: string, categoriaId: number, categoriaNome: string): Promise<{ preco: number; personalizado: boolean }> => {
    try {
      // Carregar preços personalizados do cliente
      const precosPersonalizados = await carregarPrecosPorCliente(clienteId);
      const precoPersonalizado = precosPersonalizados.find(p => p.categoria_id === categoriaId);
      
      if (precoPersonalizado && precoPersonalizado.preco_unitario > 0) {
        return {
          preco: precoPersonalizado.preco_unitario,
          personalizado: true
        };
      }
      
      // Usar preço padrão da configuração
      const configPrecificacao = obterConfiguracao('precificacao');
      const precosPadrao = configPrecificacao?.precosPorCategoria || {};
      const precoPadrao = precosPadrao[categoriaId.toString()];
      
      if (precoPadrao && precoPadrao > 0) {
        return {
          preco: precoPadrao,
          personalizado: false
        };
      }
      
      // Fallback para preços temporários
      return {
        preco: obterPrecoCategoria(categoriaNome),
        personalizado: false
      };
    } catch (error) {
      console.error(`Erro ao carregar preço para cliente ${clienteId}, categoria ${categoriaId}:`, error);
      // Fallback em caso de erro
      const configPrecificacao = obterConfiguracao('precificacao');
      const precosPadrao = configPrecificacao?.precosPorCategoria || {};
      const precoPadrao = precosPadrao[categoriaId.toString()];
      
      return {
        preco: precoPadrao || obterPrecoCategoria(categoriaNome),
        personalizado: false
      };
    }
  };

  const obterPercentualLogistico = (tipoLogistica: string): number => {
    console.log('Buscando percentual para tipo:', tipoLogistica);
    console.log('Tipos disponíveis:', tiposLogistica);
    const tipo = tiposLogistica.find(t => t.nome.toLowerCase() === tipoLogistica.toLowerCase() || tipoLogistica.toLowerCase().includes(t.nome.toLowerCase()));
    if (tipo) {
      console.log(`Percentual encontrado para ${tipoLogistica}: ${tipo.percentual_logistico}%`);
      return tipo.percentual_logistico / 100; // Converter para decimal
    }

    // Fallback para os valores antigos se não encontrar na configuração
    console.log(`Usando percentual padrão para ${tipoLogistica}`);
    if (tipoLogistica === 'Distribuição') {
      return 0.08; // 8% para distribuição
    } else if (tipoLogistica === 'Própria') {
      return 0.03; // 3% para logística própria
    }
    return 0; // Valor padrão se não encontrar
  };

  const calcularGiroSemanal = (qtdPadrao: number, periodicidade: number): number => {
    if (periodicidade === 0) return 0;
    return Math.round(qtdPadrao / periodicidade * 7);
  };

  const calcularProjecoes = async () => {
    console.log('ProjecaoResultadosPDV: Iniciando cálculo de projeções...');

    // Filtrar apenas clientes ativos
    const clientesAtivos = clientes.filter(cliente => cliente.statusCliente === 'Ativo');
    console.log('ProjecaoResultadosPDV: Clientes ativos encontrados:', clientesAtivos.length);
    
    const projecoesCalculadas: ProjecaoCliente[] = [];
    const detalhesCalculados: ClienteDetalhe[] = [];
    const clientesExcluidos: ClienteNaoIncluido[] = [];

    for (const cliente of clientesAtivos) {
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
        continue;
      }

      detalhesCliente.push({
        etapa: "DADOS_BASE",
        descricao: "Dados básicos do cliente",
        observacao: `Quantidade padrão: ${cliente.quantidadePadrao}, Periodicidade: ${cliente.periodicidadePadrao} dias, Categorias habilitadas: ${cliente.categoriasHabilitadas.length}`
      });

      const categoriasCliente = [];
      
      for (const categoriaId of cliente.categoriasHabilitadas) {
        const categoria = categorias.find(cat => cat.id === categoriaId);
        if (!categoria) {
          detalhesCliente.push({
            etapa: "ERRO_CATEGORIA",
            descricao: `Categoria ID ${categoriaId} não encontrada`,
            observacao: "Esta categoria pode ter sido removida do sistema"
          });
          continue;
        }

        const giroSemanal = calcularGiroSemanal(cliente.quantidadePadrao, cliente.periodicidadePadrao);
        
        // Obter preço específico para este cliente e categoria
        const { preco: precoAplicado, personalizado } = await obterPrecoPorCliente(
          cliente.id, 
          categoriaId, 
          categoria.nome
        );
        
        const custoUnitario = obterCustoCategoria(categoria.nome);
        const faturamento = giroSemanal * precoAplicado;
        const custoInsumos = giroSemanal * custoUnitario;
        const margemUnitaria = precoAplicado - custoUnitario;

        detalhesCliente.push({
          etapa: "CALCULO_CATEGORIA",
          descricao: `Cálculos para categoria: ${categoria.nome}`,
          formula: `Giro semanal = (${cliente.quantidadePadrao} ÷ ${cliente.periodicidadePadrao}) × 7 = ${giroSemanal}`,
          observacao: `Preço aplicado: R$ ${precoAplicado.toFixed(2)} ${personalizado ? '(PERSONALIZADO)' : '(PADRÃO)'} | Custo unitário: R$ ${custoUnitario.toFixed(2)} (${categoria.nome.toLowerCase().includes('food service') ? 'custo Food Service' : 'custo padrão'})`
        });

        detalhesCliente.push({
          etapa: "FATURAMENTO",
          descricao: `Faturamento da categoria ${categoria.nome}`,
          formula: `${giroSemanal} × R$ ${precoAplicado.toFixed(2)} ${personalizado ? '(personalizado)' : '(padrão)'} = R$ ${faturamento.toFixed(2)}`,
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
          formula: `R$ ${precoAplicado.toFixed(2)} ${personalizado ? '(personalizado)' : '(padrão)'} - R$ ${custoUnitario.toFixed(2)} = R$ ${margemUnitaria.toFixed(2)}`,
          valor: margemUnitaria
        });

        categoriasCliente.push({
          categoriaId,
          nomeCategoria: categoria.nome,
          giroSemanal,
          precoAplicado,
          precoPersonalizado: personalizado,
          faturamento,
          custoInsumos,
          margemUnitaria,
          custoUnitario
        });
      }

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
        continue;
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
        formula: cliente.emiteNotaFiscal ? `R$ ${faturamentoTotal.toFixed(2)} × ${(ALIQUOTA_PROVISORIA * 100).toFixed(1)}% = R$ ${impostoTotal.toFixed(2)}` : "Cliente não emite NF - sem impostos",
        valor: impostoTotal,
        observacao: cliente.emiteNotaFiscal ? "Alíquota provisória de 4%" : "Verificar configuração de nota fiscal"
      });

      // Obter percentual logístico baseado no tipo configurado
      const percentualLogistico = obterPercentualLogistico(cliente.tipoLogistica || 'Própria');
      const custoLogistico = faturamentoTotal * percentualLogistico;
      detalhesCliente.push({
        etapa: "LOGISTICA",
        descricao: "Cálculo de custo logístico (configuração real)",
        formula: `R$ ${faturamentoTotal.toFixed(2)} × ${(percentualLogistico * 100).toFixed(2)}% = R$ ${custoLogistico.toFixed(2)}`,
        valor: custoLogistico,
        observacao: `Tipo: ${cliente.tipoLogistica || 'Própria'} - Percentual da configuração`
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
    }

    console.log('ProjecaoResultadosPDV: Projeções calculadas:', projecoesCalculadas.length);
    console.log('ProjecaoResultadosPDV: Clientes não incluídos:', clientesExcluidos.length);
    setProjecoes(projecoesCalculadas);
    setDetalhesCalculos(detalhesCalculados);
    setClientesNaoIncluidos(clientesExcluidos);
  };

  // Cálculos para o Resumo Geral Expandido
  const calcularIndicadoresGerais = () => {
    if (projecoes.length === 0) {
      return {
        precoMedio: 0,
        giroMedio: 0,
        faturamentoMedio: 0,
        percentualClientesNF: 0,
        totalImposto: 0,
        percentualImposto: 0,
        totalLogistica: 0,
        percentualLogistica: 0,
        lucroBrutoMedio: 0,
        distribuicaoCategorias: {} as Record<string, number>,
        faturamentoPorCategoria: {} as Record<string, number>,
        faturamentoPorFormaPagamento: {} as Record<string, number>,
        custoTotalInsumos: 0,
        custoPorCategoria: {} as Record<string, number>
      };
    }

    const totalClientes = projecoes.length;
    const clientesComNF = projecoes.filter(p => p.emiteNotaFiscal).length;
    let somaPrecos = 0;
    let somaGiros = 0;
    let somaFaturamentos = 0;
    let somaLucros = 0;
    let somaCustoInsumos = 0;
    const categoriasCount: Record<string, number> = {};
    const faturamentoPorCategoria: Record<string, number> = {};
    const faturamentoPorFormaPagamento: Record<string, number> = {};
    const custoPorCategoria: Record<string, number> = {};
    let totalCategorias = 0;
    let totalCategoriasRevenda = 0;
    let totalGiroClientesHabilitados = 0;
    let totalClientesGiroHabilitados = 0;

    projecoes.forEach(projecao => {
      // Buscar o cliente para verificar configurações
      const cliente = clientes.find(c => c.id === projecao.clienteId);
      const contabilizaGiro = cliente?.contabilizarGiroMedio ?? true;
      const formaPagamento = cliente?.formaPagamento || 'Não informado';

      projecao.categorias.forEach(categoria => {
        somaFaturamentos += categoria.faturamento;
        somaCustoInsumos += categoria.custoInsumos;
        totalCategorias++;

        // Acumular faturamento por categoria
        const nomeCategoria = categoria.nomeCategoria;
        faturamentoPorCategoria[nomeCategoria] = (faturamentoPorCategoria[nomeCategoria] || 0) + categoria.faturamento;

        // Acumular custo de insumos por categoria
        custoPorCategoria[nomeCategoria] = (custoPorCategoria[nomeCategoria] || 0) + categoria.custoInsumos;

        // Acumular faturamento por forma de pagamento
        faturamentoPorFormaPagamento[formaPagamento] = (faturamentoPorFormaPagamento[formaPagamento] || 0) + categoria.faturamento;

        // Filtrar preço médio apenas para categoria "Revenda Padrão"
        if (categoria.nomeCategoria.toLowerCase().includes('revenda padrão')) {
          somaPrecos += categoria.precoAplicado;
          totalCategoriasRevenda++;
        }

        // Filtrar giro médio apenas para clientes com checkbox habilitado
        if (contabilizaGiro) {
          somaGiros += categoria.giroSemanal;
          totalGiroClientesHabilitados++;
        }

        categoriasCount[nomeCategoria] = (categoriasCount[nomeCategoria] || 0) + 1;
      });

      somaLucros += projecao.lucroBruto;
      if (contabilizaGiro) {
        totalClientesGiroHabilitados++;
      }
    });

    const faturamentoTotalSemanal = projecoes.reduce((sum, proj) => sum + proj.categorias.reduce((catSum, cat) => catSum + cat.faturamento, 0), 0);
    const totalImpostoSemanal = projecoes.reduce((sum, proj) => sum + proj.impostoTotal, 0);
    const totalLogisticaSemanal = projecoes.reduce((sum, proj) => sum + proj.custoLogistico, 0);

    // Converter valores semanais para mensais (x4)
    const faturamentoTotalMensal = faturamentoTotalSemanal * 4;
    const totalImpostoMensal = totalImpostoSemanal * 4;
    const totalLogisticaMensal = totalLogisticaSemanal * 4;
    const somaLucrosMensal = somaLucros * 4;
    const somaFaturamentosMensal = somaFaturamentos * 4;
    const custoTotalInsumosMensal = somaCustoInsumos * 4;

    // Converter faturamento por categoria para mensal
    const faturamentoPorCategoriaMensal: Record<string, number> = {};
    Object.keys(faturamentoPorCategoria).forEach(categoria => {
      faturamentoPorCategoriaMensal[categoria] = faturamentoPorCategoria[categoria] * 4;
    });

    // Converter custo por categoria para mensal
    const custoPorCategoriaMensal: Record<string, number> = {};
    Object.keys(custoPorCategoria).forEach(categoria => {
      custoPorCategoriaMensal[categoria] = custoPorCategoria[categoria] * 4;
    });

    // Converter faturamento por forma de pagamento para mensal
    const faturamentoPorFormaPagamentoMensal: Record<string, number> = {};
    Object.keys(faturamentoPorFormaPagamento).forEach(forma => {
      faturamentoPorFormaPagamentoMensal[forma] = faturamentoPorFormaPagamento[forma] * 4;
    });

    // Distribuição percentual por categoria
    const distribuicaoCategorias: Record<string, number> = {};
    Object.keys(categoriasCount).forEach(categoria => {
      distribuicaoCategorias[categoria] = categoriasCount[categoria] / totalCategorias * 100;
    });

    return {
      precoMedio: totalCategoriasRevenda > 0 ? somaPrecos / totalCategoriasRevenda : 0,
      giroMedio: totalGiroClientesHabilitados > 0 ? somaGiros / totalGiroClientesHabilitados : 0,
      faturamentoMedio: totalClientes > 0 ? somaFaturamentosMensal / totalClientes : 0,
      percentualClientesNF: totalClientes > 0 ? clientesComNF / totalClientes * 100 : 0,
      totalImposto: totalImpostoMensal,
      percentualImposto: faturamentoTotalMensal > 0 ? totalImpostoMensal / faturamentoTotalMensal * 100 : 0,
      totalLogistica: totalLogisticaMensal,
      percentualLogistica: faturamentoTotalMensal > 0 ? totalLogisticaMensal / faturamentoTotalMensal * 100 : 0,
      lucroBrutoMedio: totalClientes > 0 ? somaLucrosMensal / totalClientes : 0,
      distribuicaoCategorias,
      faturamentoPorCategoria: faturamentoPorCategoriaMensal,
      faturamentoPorFormaPagamento: faturamentoPorFormaPagamentoMensal,
      custoTotalInsumos: custoTotalInsumosMensal,
      custoPorCategoria: custoPorCategoriaMensal
    };
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
    }).format(valor / 100);
  };

  const indicadores = calcularIndicadoresGerais();
  // Converter valores semanais para mensais
  const totalGeralMensal = projecoes.reduce((sum, proj) => sum + proj.lucroBruto, 0) * 4;
  const faturamentoGeralMensal = projecoes.reduce((sum, proj) => sum + proj.categorias.reduce((catSum, cat) => catSum + cat.faturamento, 0), 0) * 4;
  const clientesAtivos = clientes.filter(cliente => cliente.statusCliente === 'Ativo');

  return (
    <div className="space-y-6">
      <PageHeader title="Projeção de Resultados por PDV" description="Análise de rentabilidade e projeções por ponto de venda" />
      
      {/* Status do Carregamento - Card existente */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Info className="h-5 w-5" />
              Status do Carregamento de Dados
            </CardTitle>
            <Button variant={mostrarDetalhes ? "default" : "outline"} size="sm" onClick={() => setMostrarDetalhes(!mostrarDetalhes)}>
              {mostrarDetalhes ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {mostrarDetalhes ? "Ocultar" : "Mostrar"} Detalhes dos Cálculos
            </Button>
          </div>
        </CardHeader>
        <CardContent className="text-sm text-blue-700">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
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
            <div className="text-center p-3 bg-white rounded border">
              <div className="font-semibold">Tipos Logística</div>
              <div className="text-2xl font-bold text-indigo-600">{tiposLogistica.length}</div>
            </div>
          </div>
          
          {mostrarDetalhes && (
            <div className="mt-4 space-y-4 max-h-96 overflow-y-auto">
              <h4 className="font-semibold text-blue-800">Tipos de Logística Configurados:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mb-4">
                {tiposLogistica.map(tipo => (
                  <div key={tipo.id} className="bg-white rounded p-2 border border-blue-200">
                    <div className="font-medium text-blue-700">{tipo.nome}</div>
                    <div className="text-sm text-blue-600">{tipo.percentual_logistico.toFixed(2)}%</div>
                  </div>
                ))}
              </div>
              
              {/* Detalhes dos cálculos por cliente */}
              <h4 className="font-semibold text-blue-800 mb-2">Detalhes dos Cálculos por Cliente:</h4>
              {detalhesCalculos.map(clienteDetalhe => (
                <div key={clienteDetalhe.clienteId} className="border border-blue-200 rounded p-3 bg-white mb-4">
                  <h5 className="font-semibold text-blue-700 mb-2">{clienteDetalhe.nomeCliente}</h5>
                  <div className="space-y-2">
                    {clienteDetalhe.calculos.map((calculo, index) => (
                      <div key={index} className="text-xs">
                        <div className="font-medium text-blue-600">{calculo.etapa}: {calculo.descricao}</div>
                        {calculo.formula && <div className="text-gray-600 ml-2">📐 {calculo.formula}</div>}
                        {calculo.valor !== undefined && <div className="text-green-600 ml-2">💰 Resultado: {formatarMoeda(calculo.valor)}</div>}
                        {calculo.observacao && <div className="text-amber-600 ml-2">ℹ️ {calculo.observacao}</div>}
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
      
      {/* Aviso de dados temporários - Card existente */}
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-amber-800">
            <AlertTriangle className="h-5 w-5" />
            Projeção com preços personalizados por cliente
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-amber-700">
          <p className="mb-2">
            Esta projeção agora utiliza os preços personalizados por cliente:
          </p>
          <ul className="space-y-1 list-disc list-inside">
            <li>✅ Preços personalizados por cliente são prioritários</li>
            <li>🔧 Preços padrão das configurações como fallback</li>
            <li>🔧 Custos unitários: Revenda Padrão (R$ 1,32), Food Service (R$ 29,17)</li>
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
          {/* Resumo Geral Expandido */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Resumo Geral - Indicadores Estratégicos
                <Badge variant="outline" className="text-xs">Valores Mensais</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Primeira linha - Indicadores principais */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Faturamento Mensal</p>
                  <p className="text-2xl font-bold text-blue-600">{formatarMoeda(faturamentoGeralMensal)}</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Lucro Bruto Mensal</p>
                  <p className="text-2xl font-bold text-green-600">{formatarMoeda(totalGeralMensal)}</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Margem Bruta</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {formatarPercentual(faturamentoGeralMensal > 0 ? totalGeralMensal / faturamentoGeralMensal * 100 : 0)}
                  </p>
                </div>
              </div>

              {/* Nova seção - Faturamento por Categoria */}
              <div className="mb-6">
                <h4 className="font-semibold text-lg flex items-center gap-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Faturamento por Categoria de Produto
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(indicadores.faturamentoPorCategoria).map(([categoria, valor]) => (
                    <div key={categoria} className="text-center p-3 bg-blue-50 rounded-lg border">
                      <p className="text-sm text-muted-foreground">{categoria}</p>
                      <p className="text-lg font-bold text-blue-600">{formatarMoeda(valor)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Nova seção - Custo de Insumos */}
              <div className="mb-6">
                <h4 className="font-semibold text-lg flex items-center gap-2 mb-4">
                  <Percent className="h-5 w-5 text-red-600" />
                  Custo de Insumos
                </h4>
                
                {/* Custo Total de Insumos */}
                <div className="mb-4">
                  <div className="text-center p-4 bg-red-50 rounded-lg border">
                    <p className="text-sm text-muted-foreground">Custo Total de Insumos</p>
                    <p className="text-2xl font-bold text-red-600">{formatarMoeda(indicadores.custoTotalInsumos)}</p>
                  </div>
                </div>

                {/* Custo por Categoria */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(indicadores.custoPorCategoria).map(([categoria, valor]) => (
                    <div key={categoria} className="text-center p-3 bg-red-50 rounded-lg border">
                      <p className="text-sm text-muted-foreground">{categoria}</p>
                      <p className="text-lg font-bold text-red-600">{formatarMoeda(valor)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Nova seção - Faturamento por Forma de Pagamento */}
              <div className="mb-6">
                <h4 className="font-semibold text-lg flex items-center gap-2 mb-4">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Faturamento por Forma de Pagamento
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(indicadores.faturamentoPorFormaPagamento).map(([forma, valor]) => (
                    <div key={forma} className="text-center p-3 bg-green-50 rounded-lg border">
                      <p className="text-sm text-muted-foreground">{forma}</p>
                      <p className="text-lg font-bold text-green-600">{formatarMoeda(valor)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Segunda linha - Indicadores operacionais */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <DollarSign className="h-4 w-4 text-gray-600" />
                    <p className="text-xs text-muted-foreground">Preço Médio</p>
                  </div>
                  <p className="text-lg font-bold text-gray-700">{formatarMoeda(indicadores.precoMedio)}</p>
                  <Badge variant="outline" className="text-xs mt-1">Revenda Padrão</Badge>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <TrendingUp className="h-4 w-4 text-gray-600" />
                    <p className="text-xs text-muted-foreground">Giro Médio</p>
                  </div>
                  <p className="text-lg font-bold text-gray-700">{indicadores.giroMedio.toFixed(0)} un/sem</p>
                  <Badge variant="outline" className="text-xs mt-1">Contabilizados</Badge>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <DollarSign className="h-4 w-4 text-gray-600" />
                    <p className="text-xs text-muted-foreground">Faturamento Médio</p>
                  </div>
                  <p className="text-lg font-bold text-gray-700">{formatarMoeda(indicadores.faturamentoMedio)}</p>
                  <Badge variant="outline" className="text-xs mt-1">Mensal</Badge>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Users className="h-4 w-4 text-gray-600" />
                    <p className="text-xs text-muted-foreground">Clientes c/ NF</p>
                  </div>
                  <p className="text-lg font-bold text-gray-700">{formatarPercentual(indicadores.percentualClientesNF)}</p>
                </div>
              </div>

              {/* Terceira linha - Custos e distribuição */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                    <Percent className="h-4 w-4" />
                    Custos e Impostos
                    <Badge variant="outline" className="text-xs">Mensais</Badge>
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center p-2 bg-red-50 rounded">
                      <span className="text-sm">Total Impostos</span>
                      <div className="text-right">
                        <div className="font-medium text-red-600">{formatarMoeda(indicadores.totalImposto)}</div>
                        <div className="text-xs text-red-500">{formatarPercentual(indicadores.percentualImposto)} do faturamento</div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-orange-50 rounded">
                      <span className="text-sm">Total Logística</span>
                      <div className="text-right">
                        <div className="font-medium text-orange-600">{formatarMoeda(indicadores.totalLogistica)}</div>
                        <div className="text-xs text-orange-500">{formatarPercentual(indicadores.percentualLogistica)} do faturamento</div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                      <span className="text-sm">Lucro Bruto Médio</span>
                      <div className="font-medium text-green-600">{formatarMoeda(indicadores.lucroBrutoMedio)}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Distribuição por Categoria
                  </h4>
                  <div className="space-y-2">
                    {Object.entries(indicadores.distribuicaoCategorias).map(([categoria, percentual]) => (
                      <div key={categoria} className="flex justify-between items-center p-2 bg-blue-50 rounded">
                        <span className="text-sm">{categoria}</span>
                        <div className="font-medium text-blue-600">{formatarPercentual(percentual)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de projeção detalhada */}
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
                      <TableHead>Contabiliza Giro</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Giro Semanal</TableHead>
                      <TableHead>Preço Aplicado</TableHead>
                      <TableHead>Custo Unit.</TableHead>
                      <TableHead>Faturamento</TableHead>
                      <TableHead>Custo Insumos</TableHead>
                      <TableHead>Margem Unit.</TableHead>
                      <TableHead>Forma Pagamento</TableHead>
                      <TableHead>NF</TableHead>
                      <TableHead>Imposto</TableHead>
                      <TableHead>Logística</TableHead>
                      <TableHead>Custo Log.</TableHead>
                      <TableHead>Lucro Bruto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projecoes.map(projecao => {
                      const cliente = clientes.find(c => c.id === projecao.clienteId);
                      const contabilizaGiro = cliente?.contabilizarGiroMedio ?? true;
                      const formaPagamento = cliente?.formaPagamento || 'Não informado';
                      
                      return projecao.categorias.map((categoria, index) => (
                        <TableRow key={`${projecao.clienteId}-${categoria.categoriaId}`}>
                          {index === 0 && (
                            <>
                              <TableCell rowSpan={projecao.categorias.length} className="font-medium border-r">
                                {projecao.nomeCliente}
                              </TableCell>
                              <TableCell rowSpan={projecao.categorias.length} className="text-center border-r">
                                <Badge variant={contabilizaGiro ? "default" : "secondary"}>
                                  {contabilizaGiro ? "Sim" : "Não"}
                                </Badge>
                              </TableCell>
                            </>
                          )}
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {categoria.nomeCategoria}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">{categoria.giroSemanal}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {formatarMoeda(categoria.precoAplicado)}
                              <Badge variant={categoria.precoPersonalizado ? "default" : "outline"} className={`text-xs ${categoria.precoPersonalizado ? 'bg-orange-100 text-orange-800' : ''}`}>
                                {categoria.precoPersonalizado ? "Personalizado" : "Padrão"}
                              </Badge>
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
                                <Badge variant="outline" className="text-xs">
                                  {formaPagamento}
                                </Badge>
                              </TableCell>
                              <TableCell rowSpan={projecao.categorias.length} className="text-center">
                                <Badge variant={projecao.emiteNotaFiscal ? "default" : "secondary"}>
                                  {projecao.emiteNotaFiscal ? "Sim" : "Não"}
                                </Badge>
                              </TableCell>
                              <TableCell rowSpan={projecao.categorias.length}>
                                <div className="flex items-center gap-1">
                                  {formatarMoeda(projecao.impostoTotal)}
                                  {projecao.impostoTotal > 0 && <Badge variant="outline" className="text-xs">4%</Badge>}
                                </div>
                              </TableCell>
                              <TableCell rowSpan={projecao.categorias.length}>
                                <div className="text-center">
                                  <div>{projecao.tipoLogistica}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {formatarPercentual(projecao.percentualLogistico * 100)}
                                  </div>
                                  <Badge variant="outline" className="text-xs mt-1">real</Badge>
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
                      ));
                    })}
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
