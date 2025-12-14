import PageHeader from "@/components/common/PageHeader";
import { Bot, RotateCcw, Package, Truck, TrendingUp, Users } from "lucide-react";
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
  { label: "Resumo do dia", icon: TrendingUp, prompt: "Me dê um resumo executivo do dia: entregas pendentes, produção necessária e alertas importantes." },
  { label: "Entregas pendentes", icon: Truck, prompt: "Quais são as entregas pendentes para os próximos 3 dias? Liste por dia com cliente e quantidade." },
  { label: "Status estoque", icon: Package, prompt: "Quais produtos estão com estoque abaixo do mínimo ou precisam de produção urgente?" },
  { label: "Top clientes", icon: Users, prompt: "Quais são os 10 maiores clientes por giro semanal? Inclua nome, giro e última entrega." },
];

export default function AgentesIA() {
  const [chatKey, setChatKey] = useState(0);
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const { stats, loading, limiteHoje, registrarUso } = useAIUsage();

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
          {QUICK_ACTIONS.map((action, idx) => (
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
