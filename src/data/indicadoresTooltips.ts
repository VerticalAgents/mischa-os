import { ExplicacaoCalculoProps } from "@/components/common/TooltipExplicativo";

/**
 * Definições centralizadas de tooltips explicativos para indicadores de giro e clientes.
 * Usado em todo o sistema para garantir consistência nas explicações.
 */
export const GIRO_TOOLTIPS: Record<string, ExplicacaoCalculoProps> = {
  // === INDICADORES DE CLIENTES/PDVs ===
  clientesAtivos: {
    titulo: "Total de PDVs",
    explicacao: "Número total de pontos de venda atendidos, incluindo clientes diretos e PDVs estimados via distribuidores.",
    formula: "Clientes Ativos (não-distribuidores) + Expositores de Distribuidores Ativos",
    exemplo: "20 clientes diretos + 11 expositores de distribuidores = 31 PDVs",
    observacoes: [
      "PDVs diretos: clientes ativos que não são distribuidores",
      "PDVs indiretos: expositores cadastrados nos distribuidores ativos",
      "Distribuidores não contam como PDV, apenas seus expositores",
      "Base para cálculo do giro médio por PDV"
    ],
    fontes: ["Cadastro de Clientes", "Distribuidores/Expositores"]
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
    explicacao: "Média semanal das últimas 4 semanas consolidadas, comparada com o histórico das primeiras 8 semanas.",
    formula: "Total de entregas (últimas 4 semanas) ÷ 4",
    exemplo: "7.680 entregas em 4 semanas = 1.920/semana",
    observacoes: [
      "Mostra tendência comparando período recente vs histórico",
      "Verde (+) indica crescimento, vermelho (-) indica queda",
      "Exclui semana atual incompleta",
      "Considera todas as entregas realizadas"
    ],
    fontes: ["Histórico de Entregas"]
  },
  
  giroMedioPorPDV: {
    titulo: "Giro Médio por PDV",
    explicacao: "Média de unidades por PDV, incluindo PDVs diretos e indiretos (via distribuidores).",
    formula: "Giro Total (4 semanas) ÷ Total de PDVs",
    exemplo: "Giro 4 sem. = 1.920, 31 PDVs = ~62 unidades/PDV/semana",
    observacoes: [
      "Total de PDVs = clientes diretos + expositores de distribuidores",
      "Verde (+) indica melhora, vermelho (-) indica queda",
      "Considera toda a rede de distribuição estimada",
      "Cálculo unificado em todo o sistema"
    ],
    fontes: ["Histórico de Entregas", "Cadastro de Clientes", "Distribuidores/Expositores"]
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
