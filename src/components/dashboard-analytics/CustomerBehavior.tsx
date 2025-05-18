
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PDVCategoryTable } from "@/components/analytics/PDVCategoryTable";
import { PaymentTypeChart } from "@/components/analytics/PaymentTypeChart";
import { LogisticsTypeChart } from "@/components/analytics/LogisticsTypeChart";
import { Cliente } from "@/types";
import { DREData } from "@/types/projections";

interface CustomerBehaviorProps {
  clientes: Cliente[];
  baseDRE: DREData | null;
}

export default function CustomerBehavior({
  clientes,
  baseDRE
}: CustomerBehaviorProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 mb-8">
        <div className="flex flex-col">
          <PDVCategoryTable clientes={clientes} baseDRE={baseDRE} />
          <div className="flex justify-end mt-2">
            <Button variant="ghost" asChild className="text-xs">
              <Link to="/clientes" className="flex items-center">
                Ver todos clientes <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex flex-col">
          <PaymentTypeChart clientes={clientes} />
          <div className="flex justify-end mt-2">
            <Button variant="ghost" asChild className="text-xs">
              <Link to="/precificacao" className="flex items-center">
                Ver precificação <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </div>
        </div>
        <div className="flex flex-col">
          <LogisticsTypeChart clientes={clientes} />
          <div className="flex justify-end mt-2">
            <Button variant="ghost" asChild className="text-xs">
              <Link to="/expedicao" className="flex items-center">
                Ver expedição <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
