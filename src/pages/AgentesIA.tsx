import PageHeader from "@/components/common/PageHeader";
import { Bot, RotateCcw, Package, Truck, TrendingUp, Users, Calendar, MapPin, ShoppingCart, TrendingDown, Award, Factory, UserPlus, Clock, DollarSign, Search, Calculator } from "lucide-react";
import { ChatBox } from "@/components/agentes-ia/ChatBox";
import { UsageMonitor } from "@/components/agentes-ia/UsageMonitor";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useAIUsage } from "@/hooks/useAIUsage";

const SUGESTOES = [
  "Quantos clientes ativos temos hoje?",
  "Qual é o giro semanal total?",
  "Quais produtos precisam de reposição?",
  "Como está a produção desta semana?",
  "Resuma os custos fixos e variáveis",
  "Quais são os top 10 clientes por giro?",
];

const QUICK_ACTIONS = [
  { label: "Clientes inativos", icon: Users, prompt: "Quais clientes não recebem entrega há mais de 14 dias?" },
  { label: "Previsão semana", icon: Calendar, prompt: "Qual a previsão de reposição para os próximos 7 dias?" },
  { label: "Performance rotas", icon: MapPin, prompt: "Como está a performance de cada rota de entrega?" },
  { label: "Insumos p/ comprar", icon: ShoppingCart, prompt: "Quais insumos preciso comprar? Mostre apenas os críticos." },
  { label: "Clientes em queda", icon: TrendingDown, prompt: "Quais clientes estão com queda de giro acima de 20%?" },
  { label: "Ranking vendedores", icon: Award, prompt: "Qual o ranking de representantes por volume de vendas?" },
  { label: "Produção necessária", icon: Factory, prompt: "O que preciso produzir esta semana considerando estoque e agendamentos?" },
  { label: "Clientes novos", icon: UserPlus, prompt: "Quais clientes foram cadastrados nos últimos 30 dias?" },
  { label: "Entregas atrasadas", icon: Clock, prompt: "Quais entregas estão atrasadas nos últimos 7 dias?" },
  { label: "Faturamento semana", icon: DollarSign, prompt: "Qual o faturamento estimado da última semana?" },
  { label: "Resumo do dia", icon: TrendingUp, prompt: "Me dê um resumo executivo do dia: entregas pendentes, produção necessária e alertas importantes." },
  { label: "Status estoque", icon: Package, prompt: "Quais produtos estão com estoque abaixo do mínimo ou precisam de produção urgente?" },
];

export default function AgentesIA() {
  const [chatKey, setChatKey] = useState(0);
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [showAllActions, setShowAllActions] = useState(false);
  const { stats, loading, limiteHoje, registrarUso } = useAIUsage();

  const visibleActions = showAllActions ? QUICK_ACTIONS : QUICK_ACTIONS.slice(0, 4);

  const handleClearConversation = () => {
    setChatKey(prev => prev + 1);
    setSelectedPrompt(null);
  };

  const handleQuickAction = (prompt: string) => {
    setSelectedPrompt(prompt);
    setChatKey(prev => prev + 1);
  };

  const handleMessageSent = () => {
    registrarUso();
  };

  return (
    <>
      <PageHeader 
        title="Mischa IA"
        description="Sua assistente inteligente com acesso a todos os dados do negócio"
        icon={<Bot className="h-5 w-5" />}
      />
      
      <div className="mt-6 space-y-4">
        {/* Usage Monitor */}
        <UsageMonitor
          hoje={stats.hoje}
          semana={stats.semana}
          mes={stats.mes}
          limiteHoje={limiteHoje}
          loading={loading}
        />

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          {visibleActions.map((action, idx) => (
            <Button
              key={idx}
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => handleQuickAction(action.prompt)}
            >
              <action.icon className="h-4 w-4" />
              {action.label}
            </Button>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={() => setShowAllActions(!showAllActions)}
          >
            {showAllActions ? "Ver menos" : `Ver mais (${QUICK_ACTIONS.length - 4})`}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 ml-auto"
            onClick={handleClearConversation}
          >
            <RotateCcw className="h-4 w-4" />
            Nova conversa
          </Button>
        </div>

        {/* Main Chat */}
        <ChatBox 
          key={chatKey}
          agenteId="diagnostico-geral" 
          sugestoes={SUGESTOES}
          initialPrompt={selectedPrompt}
          onMessageSent={handleMessageSent}
        />
      </div>
    </>
  );
}
