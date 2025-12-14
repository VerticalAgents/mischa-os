
import PageHeader from "@/components/common/PageHeader";
import { Bot } from "lucide-react";
import AgentesIACards from "@/components/agentes-ia/AgentesIACards";

export default function AgentesIA() {
  return (
    <>
      <PageHeader 
        title="Mischa IA"
        description="Sua assistente inteligente com acesso a todos os dados do negócio"
        icon={<Bot className="h-5 w-5" />}
      />
      
      <div className="mt-8">
        <div className="bg-card p-6 rounded-lg border mb-6">
          <p className="text-lg">
            A Mischa IA é sua assistente virtual treinada com os dados da sua operação. Ela tem acesso a clientes, entregas, produção, estoque, custos e muito mais. Faça perguntas como se estivesse conversando com uma consultora que conhece todos os detalhes do seu negócio.
          </p>
        </div>
        
        <AgentesIACards />
      </div>
    </>
  );
}
