import PageHeader from "@/components/common/PageHeader";
import TrocasDashboard from "@/components/controle-trocas/TrocasDashboard";
import TrocasHistoricoTable from "@/components/controle-trocas/TrocasHistoricoTable";

export default function ControleTrocas() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Controle de Trocas"
        description="Acompanhe e gerencie as trocas de produtos realizadas"
      />
      
      <TrocasDashboard />
      
      <TrocasHistoricoTable />
    </div>
  );
}
