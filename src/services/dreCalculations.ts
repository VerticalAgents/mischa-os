import { Cliente } from '@/types';
import { CustoFixo } from '@/hooks/useSupabaseCustosFixos';
import { CustoVariavel } from '@/hooks/useSupabaseCustosVariaveis';
import { useFaturamentoPrevisto } from '@/hooks/useFaturamentoPrevisto';

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
  custosInsumosRevendaPadrao: number;
  custosInsumosFoodService: number;
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
    case 'semanal': return value * 4; // Alterado de 4.33 para 4
    case 'trimestral': return value / 3;
    case 'semestral': return value / 6;
    case 'anual': return value / 12;
    case 'mensal':
    default: return value;
  }
};

// Mapeamento de categorias para grupos
const getCategoryGroup = (categoryName: string): string => {
  const name = categoryName.toLowerCase();
  if (name.includes('revenda') || name.includes('padrão')) return 'revenda padrão';
  if (name.includes('food service') || name.includes('foodservice')) return 'food service';
  if (name.includes('ufcspa')) return 'ufcspa';
  if (name.includes('personalizado')) return 'personalizados';
  return 'outros';
};

// Função para calcular custos de insumos baseado na lógica da página de projeções
// ATUALIZADO: Revenda Padrão de 31% para valor baseado no novo custo unitário R$1,41
const calculateInsumoCosts = (faturamento: number, categoryName: string): number => {
  const category = getCategoryGroup(categoryName);
  
  // Percentuais de custo de insumos por categoria (baseado na lógica da página)
  const percentuais = {
    'revenda padrão': 0.31, // 31% - mantido, mas agora baseado no custo unitário de R$1,41
    'food service': 0.42, // 42%
    'ufcspa': 0.42, // 42%
    'personalizados': 0.42, // 42%
    'outros': 0.42 // 42%
  };
  
  return faturamento * (percentuais[category] || 0.42);
};

export const calculateDREFromRealData = async (
  clientes: Cliente[],
  custosFixos: CustoFixo[],
  custosVariaveis: CustoVariavel[],
  faturamentoPrevisto?: { faturamentoMensal: number; precosDetalhados: any[] }
): Promise<DRECalculationResult> => {
  
  // Usar dados do faturamento previsto se disponível
  if (!faturamentoPrevisto || !faturamentoPrevisto.precosDetalhados) {
    throw new Error('Dados de faturamento previsto não disponíveis');
  }
  
  const { faturamentoMensal, precosDetalhados } = faturamentoPrevisto;
  
  // Calcular faturamento por categoria baseado nos dados reais
  const faturamentoPorCategoria = new Map<string, number>();
  const custosInsumosPorCategoria = new Map<string, number>();
  
  precosDetalhados.forEach(detalhe => {
    const categoria = getCategoryGroup(detalhe.categoriaNome);
    const faturamentoCategoria = detalhe.faturamentoSemanal * 4; // Alterado de 4.33 para 4
    
    faturamentoPorCategoria.set(categoria, 
      (faturamentoPorCategoria.get(categoria) || 0) + faturamentoCategoria
    );
    
    const custoInsumos = calculateInsumoCosts(faturamentoCategoria, detalhe.categoriaNome);
    custosInsumosPorCategoria.set(categoria,
      (custosInsumosPorCategoria.get(categoria) || 0) + custoInsumos
    );
  });
  
  // Receitas por categoria
  const receitaRevendaPadrao = faturamentoPorCategoria.get('revenda padrão') || 0;
  const receitaFoodService = faturamentoPorCategoria.get('food service') || 0;
  const receitaUFCSPA = faturamentoPorCategoria.get('ufcspa') || 0;
  const receitaPersonalizados = faturamentoPorCategoria.get('personalizados') || 0;
  const receitaOutros = faturamentoPorCategoria.get('outros') || 0;
  
  // Custos de insumos por categoria
  const custosInsumosRevendaPadrao = custosInsumosPorCategoria.get('revenda padrão') || 0;
  const custosInsumosFoodService = custosInsumosPorCategoria.get('food service') || 0;
  const custosInsumosUFCSPA = custosInsumosPorCategoria.get('ufcspa') || 0;
  const custosInsumosPersonalizados = custosInsumosPorCategoria.get('personalizados') || 0;
  const custosInsumosOutros = custosInsumosPorCategoria.get('outros') || 0;
  
  // Totais
  const totalReceita = faturamentoMensal;
  const custosInsumos = custosInsumosRevendaPadrao + custosInsumosFoodService + 
                       custosInsumosUFCSPA + custosInsumosPersonalizados + custosInsumosOutros;
  
  // Filtrar clientes ativos
  const clientesAtivos = clientes.filter(c => c.statusCliente === 'Ativo' && c.contabilizarGiroMedio);
  
  // Contar clientes com NF
  const clientesComNF = clientesAtivos.filter(c => c.emiteNotaFiscal).length;
  const percentualImpostos = clientesComNF / clientesAtivos.length;
  
  // Calcular custos logísticos baseado no tipo de logística
  let custosLogisticos = 0;
  clientesAtivos.forEach(cliente => {
    const faturamentoCliente = precosDetalhados
      .filter(p => p.clienteId === cliente.id)
      .reduce((sum, p) => sum + (p.faturamentoSemanal * 4), 0); // Alterado de 4.33 para 4
    
    let percentualLogistico = 0;
    if (cliente.tipoLogistica === 'Distribuição') {
      percentualLogistico = 0.08; // 8%
    } else if (cliente.tipoLogistica === 'Própria') {
      percentualLogistico = 0.03; // 3%
    } else {
      percentualLogistico = 0.05; // 5%
    }
    
    custosLogisticos += faturamentoCliente * percentualLogistico;
  });
  
  // Custos de aquisição (8% do faturamento)
  const custosAquisicaoClientes = totalReceita * 0.08;
  
  // Custos de impostos (15% sobre faturamento com NF)
  const custosImpostos = totalReceita * percentualImpostos * 0.15;
  
  // Total de custos variáveis
  const totalCustosVariaveis = custosInsumos + custosLogisticos + custosAquisicaoClientes + custosImpostos;
  
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
  
  // Preparar dados por categoria para auditoria
  const categoriasDados = [
    { nome: 'revenda padrão', faturamento: receitaRevendaPadrao, custoInsumos: custosInsumosRevendaPadrao },
    { nome: 'food service', faturamento: receitaFoodService, custoInsumos: custosInsumosFoodService },
    { nome: 'ufcspa', faturamento: receitaUFCSPA, custoInsumos: custosInsumosUFCSPA },
    { nome: 'personalizados', faturamento: receitaPersonalizados, custoInsumos: custosInsumosPersonalizados },
    { nome: 'outros', faturamento: receitaOutros, custoInsumos: custosInsumosOutros }
  ];
  
  const faturamentoPorCategoriaArray = categoriasDados
    .filter(cat => cat.faturamento > 0)
    .map(cat => ({
      categoria: cat.nome,
      faturamento: cat.faturamento,
      custoInsumos: cat.custoInsumos,
      margem: cat.faturamento - cat.custoInsumos
    }));
  
  console.log('📊 DRE Calculada com custo unitário atualizado - Revenda Padrão: R$1,41:', {
    totalReceita,
    custosInsumos,
    receitaRevendaPadrao,
    receitaFoodService,
    custosInsumosRevendaPadrao,
    custosInsumosFoodService
  });
  
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
    custosInsumosRevendaPadrao,
    custosInsumosFoodService,
    custosLogisticos,
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
      faturamentoPorCategoria: faturamentoPorCategoriaArray
    }
  };
};
