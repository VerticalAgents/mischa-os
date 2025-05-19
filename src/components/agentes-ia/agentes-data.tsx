
import { 
  LightbulbIcon, 
  TrendingUpIcon, 
  TruckIcon, 
  PackageIcon, 
  MessageSquareIcon, 
  AlertTriangleIcon, 
  ActivityIcon 
} from "lucide-react";
import { ReactNode } from "react";

export type AgenteIA = {
  id: string;
  nome: string;
  descricao: string;
  recursos: string[];
  instrucoes: string;
  sugestoesPergunta: string[];
  icon: ReactNode;
};

export const agentesIA: AgenteIA[] = [
  {
    id: "projecoes-financeiras",
    nome: "Agente de Projeções Financeiras",
    descricao: "Análise detalhada de tendências financeiras e projeções de faturamento para seu negócio",
    recursos: [
      "Projeções de receita com base em dados históricos",
      "Análise de ponto de equilíbrio",
      "Simulações de cenários financeiros"
    ],
    instrucoes: "Este agente analisa seus dados financeiros históricos para criar projeções e ajudar na tomada de decisões estratégicas. Ele pode simular diferentes cenários de crescimento, analisar margens de lucro por produto e identificar oportunidades de otimização financeira.",
    sugestoesPergunta: [
      "Qual a projeção de faturamento para o próximo trimestre?",
      "Simule um cenário com aumento de 15% nos custos de insumos",
      "Qual o impacto financeiro se aumentarmos as vendas do produto X em 20%?"
    ],
    icon: <LightbulbIcon className="h-5 w-5 text-yellow-500" />
  },
  {
    id: "otimizacao-producao",
    nome: "Agente de Otimização da Produção",
    descricao: "Recomendações para aumentar a eficiência produtiva e reduzir desperdícios",
    recursos: [
      "Análise de eficiência da linha de produção",
      "Recomendações de ajustes no processo produtivo",
      "Previsão de necessidades de matéria-prima"
    ],
    instrucoes: "Este agente analisa os dados de produção para identificar gargalos, ineficiências e oportunidades de melhoria. Ele fornece recomendações específicas para otimizar o processo produtivo, reduzir desperdícios e aumentar a capacidade.",
    sugestoesPergunta: [
      "Como posso otimizar a produção do produto Y?",
      "Quais são os principais gargalos na nossa linha de produção?",
      "Qual seria o impacto de adicionar um novo equipamento na etapa X?"
    ],
    icon: <TrendingUpIcon className="h-5 w-5 text-green-500" />
  },
  {
    id: "logistica-roteirizacao",
    nome: "Agente de Logística e Roteirização",
    descricao: "Otimização de rotas de entrega e gestão logística eficiente",
    recursos: [
      "Planejamento de rotas otimizadas",
      "Análise de custos logísticos",
      "Recomendações para redução do tempo de entrega"
    ],
    instrucoes: "Este agente analisa dados de entregas e logística para otimizar rotas, reduzir custos de transporte e melhorar o tempo de entrega. Ele considera fatores como distância, tráfego, tipos de veículos e características dos clientes.",
    sugestoesPergunta: [
      "Qual a melhor rota para entregas na região sul da cidade?",
      "Como reduzir os custos de transporte em 10%?",
      "Quantos veículos precisamos para atender a demanda do próximo mês?"
    ],
    icon: <TruckIcon className="h-5 w-5 text-blue-500" />
  },
  {
    id: "reposicao-inteligente",
    nome: "Agente de Reposição Inteligente",
    descricao: "Análise de assertividade de estoque e recomendações de reposição",
    recursos: [
      "Previsão de demanda por produto",
      "Análise de nível ideal de estoque",
      "Alertas de necessidade de reposição"
    ],
    instrucoes: "Este agente analisa o histórico de vendas, níveis de estoque e sazonalidade para prever demandas futuras e recomendar estratégias de reposição. Ele ajuda a evitar tanto a falta quanto o excesso de produtos em estoque.",
    sugestoesPergunta: [
      "Quais produtos precisam ser repostos nos próximos 7 dias?",
      "Qual a quantidade ideal de estoque para o produto Z?",
      "Como nossa assertividade de estoque se compara ao mercado?"
    ],
    icon: <PackageIcon className="h-5 w-5 text-orange-500" />
  },
  {
    id: "comunicacao-clientes",
    nome: "Agente de Comunicação com Clientes",
    descricao: "Sugestões para melhorar o relacionamento e a comunicação com clientes",
    recursos: [
      "Análise de padrões de compra de clientes",
      "Segmentação de clientes para comunicações personalizadas",
      "Modelos de mensagens para diferentes ocasiões"
    ],
    instrucoes: "Este agente analisa o comportamento dos clientes para ajudar a criar comunicações mais eficazes e personalizadas. Ele identifica oportunidades de engajamento, retenção e reativação, sugerindo a melhor abordagem para cada segmento.",
    sugestoesPergunta: [
      "Como melhorar a taxa de resposta das nossas campanhas de email?",
      "Quais clientes estão em risco de abandono?",
      "Que tipo de oferta seria mais atrativa para o segmento X?"
    ],
    icon: <MessageSquareIcon className="h-5 w-5 text-purple-500" />
  },
  {
    id: "alertas-estrategicos",
    nome: "Agente de Alertas Estratégicos",
    descricao: "Monitoramento constante e alertas sobre desvios importantes nos KPIs",
    recursos: [
      "Monitoramento contínuo de indicadores críticos",
      "Alertas personalizáveis por tipo e gravidade",
      "Análise de causas de desvios"
    ],
    instrucoes: "Este agente monitora constantemente os principais indicadores do seu negócio e alerta sobre desvios significativos. Ele analisa tendências, identifica anomalias e sugere ações corretivas antes que os problemas se agravem.",
    sugestoesPergunta: [
      "Quais indicadores estão fora da meta neste mês?",
      "Por que as vendas caíram na região norte?",
      "Qual o impacto estimado do aumento de custos no lucro final?"
    ],
    icon: <AlertTriangleIcon className="h-5 w-5 text-red-500" />
  },
  {
    id: "diagnostico-geral",
    nome: "Agente de Diagnóstico Geral",
    descricao: "Visão integrada do negócio com recomendações multidisciplinares",
    recursos: [
      "Dashboard integrado com principais KPIs",
      "Diagnóstico completo do negócio",
      "Recomendações priorizadas por impacto"
    ],
    instrucoes: "Este agente oferece uma visão holística do seu negócio, integrando dados de todas as áreas para identificar conexões e oferecer diagnósticos completos. Ele ajuda a priorizar ações com base no impacto esperado e na facilidade de implementação.",
    sugestoesPergunta: [
      "Qual a saúde geral do negócio neste momento?",
      "Quais são as 3 principais oportunidades de melhoria?",
      "Como melhorar a lucratividade em 5% nos próximos 6 meses?"
    ],
    icon: <ActivityIcon className="h-5 w-5 text-indigo-500" />
  }
];

export const getAgenteById = (id: string): AgenteIA | undefined => {
  return agentesIA.find(agente => agente.id === id);
};
