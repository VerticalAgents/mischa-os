
import { BotIcon } from "lucide-react";
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
    id: "diagnostico-geral",
    nome: "Mischa IA",
    descricao: "Assistente inteligente com acesso completo aos dados do seu negócio",
    recursos: [
      "Acesso a clientes, entregas, agendamentos e histórico",
      "Análise de produção, estoque e custos",
      "Visão integrada de todas as áreas do negócio"
    ],
    instrucoes: "A Mischa IA é sua assistente virtual com acesso a todos os dados da operação. Ela pode responder perguntas sobre clientes, entregas, produção, estoque, custos, leads e muito mais. Use-a como uma consultora estratégica que conhece todos os detalhes do seu negócio.",
    sugestoesPergunta: [
      "Quais clientes precisam de reposição essa semana?",
      "Qual o estoque atual de produtos?",
      "Quantas entregas estão previstas para amanhã?",
      "Quais são os top 10 clientes por giro semanal?",
      "Qual o custo fixo mensal total?"
    ],
    icon: <BotIcon className="h-5 w-5 text-primary" />
  }
];

export const getAgenteById = (id: string): AgenteIA | undefined => {
  return agentesIA.find(agente => agente.id === id);
};
