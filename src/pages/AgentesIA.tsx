
import PageHeader from "@/components/common/PageHeader";
import { Cpu } from "lucide-react";
import AgentesIACards from "@/components/agentes-ia/AgentesIACards";

export default function AgentesIA() {
  return (
    <>
      <PageHeader 
        title="Agentes de IA"
        description="Assistentes inteligentes especializados em diferentes áreas do seu negócio"
        icon={<Cpu className="h-5 w-5" />}
      />
      
      <div className="mt-8">
        <div className="bg-card p-6 rounded-lg border mb-6">
          <p className="text-lg">
            Bem-vindo à área de Agentes de IA. Estes assistentes foram treinados com base nos dados da sua operação e se comportam como consultores especializados em áreas como produção, logística, finanças e clientes. Use-os para tomar decisões melhores e fazer sua empresa prosperar.
          </p>
        </div>
        
        <AgentesIACards />
      </div>
    </>
  );
}
