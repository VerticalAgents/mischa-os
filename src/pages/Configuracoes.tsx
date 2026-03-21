import PageHeader from "@/components/common/PageHeader";
import ConfiguracoesTabs from "@/components/configuracoes/ConfiguracoesTabs";
import { Settings } from "lucide-react";
import { useRoutePermission } from "@/hooks/useRolePermissions";
import { EditPermissionProvider } from "@/contexts/EditPermissionContext";

export default function Configuracoes() {
  const { canEdit } = useRoutePermission('/configuracoes');

  return (
    <EditPermissionProvider value={{ canEdit }}>
    <div className="flex flex-col h-full">
      <PageHeader 
        title="Configurações"
        description="Gerencie as configurações do sistema"
        icon={<Settings className="h-5 w-5" />}
      />
      
      <div className="mt-6 flex-1 min-h-0">
        <ConfiguracoesTabs />
      </div>
    </div>
    </EditPermissionProvider>
  );
}
