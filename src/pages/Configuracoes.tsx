
import PageHeader from "@/components/common/PageHeader";
import ConfiguracoesTabs from "@/components/configuracoes/ConfiguracoesTabs";
import { Settings } from "lucide-react";

export default function Configuracoes() {
  return (
    <>
      <PageHeader 
        title="Configurações"
        description="Gerencie as configurações do sistema"
        icon={<Settings className="h-5 w-5" />}
      />
      
      <div className="mt-8">
        <ConfiguracoesTabs />
      </div>
    </>
  );
}
