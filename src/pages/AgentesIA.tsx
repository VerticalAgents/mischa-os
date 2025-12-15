import PageHeader from "@/components/common/PageHeader";
import { Bot, RotateCcw } from "lucide-react";
import { ChatBox } from "@/components/agentes-ia/ChatBox";
import { UsageMonitor } from "@/components/agentes-ia/UsageMonitor";
import { QuickActionsCategories } from "@/components/agentes-ia/QuickActionsCategories";
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

        {/* Quick Actions por Categoria */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Ações Rápidas</span>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={handleClearConversation}
            >
              <RotateCcw className="h-4 w-4" />
              Nova conversa
            </Button>
          </div>
          <QuickActionsCategories onSelectAction={handleQuickAction} />
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
