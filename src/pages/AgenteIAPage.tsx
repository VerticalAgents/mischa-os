
import PageHeader from "@/components/common/PageHeader";
import { Cpu } from "lucide-react";
import { useParams, Navigate } from "react-router-dom";
import { getAgenteById } from "@/components/agentes-ia/agentes-data";
import AgenteIADetail from "@/components/agentes-ia/AgenteIADetail";

export default function AgenteIAPage() {
  const { id } = useParams<{ id: string }>();
  const agente = id ? getAgenteById(id) : undefined;
  
  if (!agente) {
    return <Navigate to="/agentes-ia" replace />;
  }
  
  return (
    <>
      <PageHeader 
        title="Agentes de IA"
        description={agente.nome}
        icon={<Cpu className="h-5 w-5" />}
        backLink="/agentes-ia"
      />
      
      <div className="mt-8">
        <AgenteIADetail agente={agente} />
      </div>
    </>
  );
}
