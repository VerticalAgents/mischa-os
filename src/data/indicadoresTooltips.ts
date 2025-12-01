import { ExplicacaoCalculoProps } from "@/components/common/TooltipExplicativo";

/**
 * Definições centralizadas de tooltips explicativos para indicadores de giro e clientes.
 * Usado em todo o sistema para garantir consistência nas explicações.
 */
export const GIRO_TOOLTIPS: Record<string, ExplicacaoCalculoProps> = {
  // === INDICADORES DE CLIENTES ===
  clientesAtivos: {
    titulo: "Clientes Ativos",
    explicacao: "Número de clientes com status 'Ativo', representando PDVs que recebem entregas regularmente.",
    observacoes: [
      "Exclui clientes inativos, em análise, standby e pipeline",
      "Base para cálculos de giro médio"
    ],
    fontes: ["Cadastro de Clientes"]
  },
  
  totalClientes: {
    titulo: "Total de Clientes",
    explicacao: "Número total de clientes cadastrados, incluindo todos os status.",
    observacoes: [
      "Inclui clientes ativos, inativos, em análise, standby e pipeline",
      "Atualizado em tempo real conforme cadastros"
    ],
    fontes: ["Cadastro de Clientes"]
  },
  
  clientesEmAnalise: {
    titulo: "Clientes em Análise",
    explicacao: "Número de clientes com status 'Em análise', representando o pipeline de ativação.",
    observacoes: [
      "Clientes em processo de avaliação",
      "Potencial de conversão para ativos",
      "Requer acompanhamento próximo"
    ],
    fontes: ["Status dos Clientes"]
  },

  // === INDICADORES DE GIRO ===
  giroSemanalTotal: {
    titulo: "Giro Semanal Total",
    explicacao: "Soma do giro semanal real de todos os clientes ativos, calculado com base no histórico de entregas dos últimos 84 dias.",
    formula: "Σ(Quantidade entregue por cliente nos últimos 84 dias ÷ Semanas com entregas)",
    exemplo: "Cliente A: 20/sem + Cliente B: 15/sem + Cliente C: 25/sem = 60 total",
    observacoes: [
      "Considera apenas clientes com status 'Ativo'",
      "Baseado em dados reais de entrega, não estimativas",
      "Período de análise: 84 dias (12 semanas)"
    ],
    fontes: ["Histórico de Entregas"]
  },
  
  giroMedioPorPDV: {
    titulo: "Giro Médio por PDV",
    explicacao: "Média aritmética do giro semanal dos PDVs ativos, representando a performance média de cada ponto de venda.",
    formula: "Giro Total ÷ Número de Clientes Ativos",
    exemplo: "Giro total 200, 10 ativos = 20 unidades/PDV/semana",
    observacoes: [
      "Considera todos os clientes ativos, inclusive os com giro zero",
      "Útil para comparar performance entre representantes ou regiões",
      "Cálculo unificado em todo o sistema"
    ],
    fontes: ["Histórico de Entregas", "Cadastro de Clientes"]
  },
  
  totalUltimos30Dias: {
    titulo: "Total Últimos 30 Dias",
    explicacao: "Soma de todas as quantidades entregues nos últimos 30 dias corridos.",
    observacoes: [
      "Período fixo de 30 dias a partir de hoje",
      "Inclui todas as entregas confirmadas"
    ],
    fontes: ["Histórico de Entregas"]
  },
  
  giroMedioSemanal: {
    titulo: "Giro Médio Semanal",
    explicacao: "Média semanal de entregas calculada com base nas últimas 4 semanas consolidadas (excluindo a semana atual incompleta).",
    formula: "Soma das entregas das últimas 4 semanas ÷ 4",
    observacoes: [
      "Semana atual não é considerada pois ainda está em andamento",
      "Comparado com média histórica para indicar tendência"
    ],
    fontes: ["Histórico de Entregas"]
  },

  // === INDICADORES DE PERFORMANCE ===
  taxaConversao: {
    titulo: "Taxa de Conversão",
    explicacao: "Percentual de clientes que estão ativos em relação ao total de clientes.",
    formula: "(Clientes Ativos ÷ Total de Clientes) × 100",
    exemplo: "20 ativos de 50 total = 40% de conversão",
    observacoes: [
      "Indica eficiência na ativação de clientes",
      "Meta sugerida: acima de 60%",
      "Considera todos os clientes cadastrados"
    ],
    fontes: ["Status dos Clientes", "Base Total de Clientes"]
  },

  tendencia12Semanas: {
    titulo: "Tendência (12 Semanas)",
    explicacao: "Direção da variação do giro nas últimas 12 semanas, indicando crescimento, queda ou estabilidade.",
    observacoes: [
      "Crescimento: variação positiva significativa",
      "Queda: variação negativa significativa",
      "Estável: variação dentro da margem normal"
    ],
    fontes: ["Histórico de Entregas"]
  },

  semanaAtualProjecao: {
    titulo: "Semana Atual (Projeção)",
    explicacao: "Projeção do giro total para a semana atual, baseado nas entregas já realizadas e agendamentos confirmados.",
    formula: "Giro Real + Giro Agendado",
    observacoes: [
      "Real: entregas já confirmadas na semana",
      "Agendado: entregas programadas para os dias restantes",
      "Atualizado conforme entregas são confirmadas"
    ],
    fontes: ["Histórico de Entregas", "Agendamentos"]
  },

  amplitude: {
    titulo: "Amplitude (Pico/Vale)",
    explicacao: "Diferença entre o maior e menor giro semanal nas últimas 12 semanas, indicando a variabilidade das vendas.",
    formula: "Pico - Vale",
    observacoes: [
      "Pico: semana com maior volume de entregas",
      "Vale: semana com menor volume de entregas",
      "Alta amplitude indica maior variabilidade"
    ],
    fontes: ["Histórico de Entregas"]
  }
};
