
import { useEffect } from "react";
import PageHeader from "@/components/common/PageHeader";
import { useClientesSupabase } from "@/hooks/useClientesSupabase";
import { useProjectionStore } from "@/hooks/useProjectionStore";
import { PDVCategoryTable } from "@/components/analytics/PDVCategoryTable";
import { PaymentTypeChart } from "@/components/analytics/PaymentTypeChart";
import { LogisticsTypeChart } from "@/components/analytics/LogisticsTypeChart";

export default function Analytics() {
  const { clientes } = useClientesSupabase();
  const { generateBaseDRE, baseDRE } = useProjectionStore();
  
  // Generate base DRE if it doesn't exist
  useEffect(() => {
    if (clientes.length > 0 && !baseDRE) {
      generateBaseDRE(clientes);
    }
  }, [clientes, generateBaseDRE, baseDRE]);

  return (
    <>
      <PageHeader 
        title="Analytics" 
        description="Visão analítica de PDVs, pagamentos e logística"
      />
      
      <div className="grid gap-6 mb-8">
        <PDVCategoryTable clientes={clientes} baseDRE={baseDRE} />
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <PaymentTypeChart clientes={clientes} />
        <LogisticsTypeChart clientes={clientes} />
      </div>
    </>
  );
}
