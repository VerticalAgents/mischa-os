import PageHeader from "@/components/common/PageHeader";
import TrocasDashboard from "@/components/controle-trocas/TrocasDashboard";
import TrocasHistoricoTable from "@/components/controle-trocas/TrocasHistoricoTable";
import { useRoutePermission } from "@/hooks/useRolePermissions";
import { EditPermissionProvider } from "@/contexts/EditPermissionContext";

export default function ControleTrocas() {
  const { canEdit } = useRoutePermission('/controle-trocas');

  return (
    <EditPermissionProvider value={{ canEdit }}>
    <div className="space-y-6">
      <PageHeader
        title="Controle de Trocas"
        description="Acompanhe e gerencie as trocas de produtos realizadas"
      />
      
      <TrocasDashboard />
      
      <TrocasHistoricoTable />
    </div>
    </EditPermissionProvider>
  );
}
