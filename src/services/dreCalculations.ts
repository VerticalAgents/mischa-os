
import { Cliente } from '@/types';
import { useFaturamentoPrevisto } from '@/hooks/useFaturamentoPrevisto';
import { CustoFixo } from '@/hooks/useSupabaseCustosFixos';
import { CustoVariavel } from '@/hooks/useSupabaseCustosVariaveis';

export interface DRECalculationResult {
  // Receitas
  totalReceita: number;
  receitaRevendaPadrao: number;
  receitaFoodService: number;
  receitaUFCSPA: number;
  receitaPersonalizados: number;
  receitaOutros: number;
  
  // Custos Variáveis
  totalCustosVariaveis: number;
  custosInsumos: number;
  custosLogisticos: number;
  custosAquisicaoClientes: number;
  custosImpostos: number;
  
  // Custos Fixos
  totalCustosFixos: number;
  custosFixosDetalhados: { nome: string; valor: number }[];
  
  // Custos Administrativos
  totalCustosAdministrativos: number;
  custosAdministrativosDetalhados: { nome: string; valor: number }[];
  
  // Resultados
  lucroOperacional: number;
  margemOperacional: number;
  margemBruta: number;
  ebitda: number;
  pontoEquilibrio: number;
  
  // Detalhes para auditoria
  detalhesCalculos: {
    clientesAtivos: number;
    clientesComNF: number;
    clientesSemNF: number;
    percentualImpostos: number;
    faturamentoPorCategoria: Array<{
      categoria: string;
      faturamento: number;
      custoInsumos: number;
      margem: number;
    }>;
  };
}

// Helper para converter frequência para valor mensal
const convertToMonthlyValue = (value: number, frequency: string): number => {
  switch (frequency) {
    case 'semanal': return value * 4.33;
    case 'trimestral': return value / 3;
    case 'semestral': return value / 6;
    case 'anual': return value / 12;
    case 'mensal':
    default: return value;
  }
};

// Helper para categorizar cliente
const getClientCategory = (cliente: Cliente): 'revenda padrão' | 'food service' | 'ufcspa' | 'personalizados' | 'outros' => {
  const nome = cliente.nome.toLowerCase();
  
  if (nome.includes('ufcspa')) return 'ufcspa';
  if (nome.includes('personalizado')) return 'personalizados';
  if (nome.includes('food service') || nome.includes('restaurante') || cliente.quantidadePadrao > 50) {
    return 'food service';
  }
  if (cliente.tipoLogistica === 'Distribuição') return 'revenda padrão';
  
  return 'outros';
};

// Preços por categoria (baseado na lógica existente)
const PRECOS_POR_CATEGORIA = {
  'revenda padrão': 4.50,
  'food service': 70.00,
  'ufcspa': 5.50,
  'personalizados': 6.00,
  'outros': 5.50
};

// Custos unitários por categoria
const CUSTOS_UNITARIOS_POR_CATEGORIA = {
  'revenda padrão': 1.32,
  'food service': 29.17,
  'ufcspa': 2.30,
  'personalizados': 2.50,
  'outros': 2.30
};

export const calculateDREFromRealData = async (
  clientes: Cliente[],
  custosFixos: CustoFixo[],
  custosVariaveis: CustoVariavel[],
  faturamentoPrevisto?: { faturamentoMensal: number; precosDetalhados: any[] }
): Promise<DRECalculationResult> => {
  
  // Filtrar clientes ativos
  const clientesAtivos = clientes.filter(c => c.statusCliente === 'Ativo' && c.contabilizarGiroMedio);
  
  // Calcular receitas por categoria
  let receitaRevendaPadrao = 0;
  let receitaFoodService = 0;
  let receitaUFCSPA = 0;
  let receitaPersonalizados = 0;
  let receitaOutros = 0;
  
  // Calcular custos de insumos por categoria
  let custosInsumosRevenda = 0;
  let custosInsumosFoodService = 0;
  let custosInsumosUFCSPA = 0;
  let custosInsumosPersonalizados = 0;
  let custosInsumosOutros = 0;
  
  let custosLogisticosTotal = 0;
  let clientesComNF = 0;
  
  const faturamentoPorCategoria: Array<{
    categoria: string;
    faturamento: number;
    custoInsumos: number;
    margem: number;
  }> = [];
  
  // Calcular para cada cliente
  clientesAtivos.forEach(cliente => {
    const categoria = getClientCategory(cliente);
    const giroSemanal = cliente.quantidadePadrao * (7 / cliente.periodicidadePadrao);
    const giroMensal = giroSemanal * 4.33;
    
    const precoUnitario = PRECOS_POR_CATEGORIA[categoria];
    const custoUnitario = CUSTOS_UNITARIOS_POR_CATEGORIA[categoria];
    
    const faturamento = giroMensal * precoUnitario;
    const custoInsumos = giroMensal * custoUnitario;
    
    // Acumular receitas por categoria
    switch (categoria) {
      case 'revenda padrão':
        receitaRevendaPadrao += faturamento;
        custosInsumosRevenda += custoInsumos;
        break;
      case 'food service':
        receitaFoodService += faturamento;
        custosInsumosFoodService += custoInsumos;
        break;
      case 'ufcspa':
        receitaUFCSPA += faturamento;
        custosInsumosUFCSPA += custoInsumos;
        break;
      case 'personalizados':
        receitaPersonalizados += faturamento;
        custosInsumosPersonalizados += custoInsumos;
        break;
      case 'outros':
        receitaOutros += faturamento;
        custosInsumosOutros += custoInsumos;
        break;
    }
    
    // Calcular custos logísticos
    let percentualLogistico = 0;
    if (cliente.tipoLogistica === 'Distribuição') {
      percentualLogistico = 0.08; // 8%
    } else if (cliente.tipoLogistica === 'Própria') {
      percentualLogistico = 0.03; // 3%
    } else {
      percentualLogistico = 0.05; // 5%
    }
    
    custosLogisticosTotal += faturamento * percentualLogistico;
    
    // Contar clientes com NF
    if (cliente.emiteNotaFiscal) {
      clientesComNF++;
    }
  });
  
  // Preparar dados por categoria para auditoria
  const categorias = [
    { nome: 'revenda padrão', faturamento: receitaRevendaPadrao, custoInsumos: custosInsumosRevenda },
    { nome: 'food service', faturamento: receitaFoodService, custoInsumos: custosInsumosFoodService },
    { nome: 'ufcspa', faturamento: receitaUFCSPA, custoInsumos: custosInsumosUFCSPA },
    { nome: 'personalizados', faturamento: receitaPersonalizados, custoInsumos: custosInsumosPersonalizados },
    { nome: 'outros', faturamento: receitaOutros, custoInsumos: custosInsumosOutros }
  ];
  
  categorias.forEach(cat => {
    if (cat.faturamento > 0) {
      faturamentoPorCategoria.push({
        categoria: cat.nome,
        faturamento: cat.faturamento,
        custoInsumos: cat.custoInsumos,
        margem: cat.faturamento - cat.custoInsumos
      });
    }
  });
  
  // Totais de receita
  const totalReceita = receitaRevendaPadrao + receitaFoodService + receitaUFCSPA + receitaPersonalizados + receitaOutros;
  
  // Custos de insumos total
  const custosInsumos = custosInsumosRevenda + custosInsumosFoodService + custosInsumosUFCSPA + custosInsumosPersonalizados + custosInsumosOutros;
  
  // Custos de aquisição (8% do faturamento)
  const custosAquisicaoClientes = totalReceita * 0.08;
  
  // Custos de impostos (baseado na proporção de clientes com NF)
  const percentualImpostos = clientesComNF / clientesAtivos.length;
  const custosImpostos = totalReceita * percentualImpostos * 0.15; // 15% sobre faturamento com NF
  
  // Total de custos variáveis
  const totalCustosVariaveis = custosInsumos + custosLogisticosTotal + custosAquisicaoClientes + custosImpostos;
  
  // Processar custos fixos
  const custosFixosDetalhados = custosFixos.map(custo => ({
    nome: custo.nome,
    valor: convertToMonthlyValue(custo.valor, custo.frequencia)
  }));
  const totalCustosFixos = custosFixosDetalhados.reduce((sum, custo) => sum + custo.valor, 0);
  
  // Processar custos administrativos
  const custosAdministrativosDetalhados = custosVariaveis.map(custo => ({
    nome: custo.nome,
    valor: convertToMonthlyValue(custo.valor, custo.frequencia)
  }));
  const totalCustosAdministrativos = custosAdministrativosDetalhados.reduce((sum, custo) => sum + custo.valor, 0);
  
  // Cálculos de resultado
  const lucroOperacional = totalReceita - totalCustosVariaveis - totalCustosFixos - totalCustosAdministrativos;
  const margemOperacional = totalReceita > 0 ? (lucroOperacional / totalReceita) * 100 : 0;
  const margemBruta = totalReceita > 0 ? ((totalReceita - totalCustosVariaveis) / totalReceita) * 100 : 0;
  
  // EBITDA (assumindo depreciação de 10% dos custos fixos)
  const depreciacaoEstimada = totalCustosFixos * 0.1;
  const ebitda = lucroOperacional + depreciacaoEstimada;
  
  // Ponto de equilíbrio
  const margemContribuicao = totalReceita - totalCustosVariaveis;
  const pontoEquilibrio = margemContribuicao > 0 ? (totalCustosFixos + totalCustosAdministrativos) / (margemContribuicao / totalReceita) : 0;
  
  return {
    // Receitas
    totalReceita,
    receitaRevendaPadrao,
    receitaFoodService,
    receitaUFCSPA,
    receitaPersonalizados,
    receitaOutros,
    
    // Custos Variáveis
    totalCustosVariaveis,
    custosInsumos,
    custosLogisticos: custosLogisticosTotal,
    custosAquisicaoClientes,
    custosImpostos,
    
    // Custos Fixos
    totalCustosFixos,
    custosFixosDetalhados,
    
    // Custos Administrativos
    totalCustosAdministrativos,
    custosAdministrativosDetalhados,
    
    // Resultados
    lucroOperacional,
    margemOperacional,
    margemBruta,
    ebitda,
    pontoEquilibrio,
    
    // Detalhes para auditoria
    detalhesCalculos: {
      clientesAtivos: clientesAtivos.length,
      clientesComNF,
      clientesSemNF: clientesAtivos.length - clientesComNF,
      percentualImpostos: percentualImpostos * 100,
      faturamentoPorCategoria
    }
  };
};
