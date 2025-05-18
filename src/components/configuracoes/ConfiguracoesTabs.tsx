import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Settings, DollarSign, CalendarClock, Truck, UserCog, Database, FileSpreadsheet, BoxesIcon } from "lucide-react";
import EmpresaTab from "./tabs/EmpresaTab";
import SistemaTab from "./tabs/SistemaTab";
import FinanceiroTab from "./tabs/FinanceiroTab";
import ClientesTab from "./tabs/ClientesTab";
import ProducaoTab from "./tabs/ProducaoTab";
export default function ConfiguracoesTabs() {
  const [activeTab, setActiveTab] = useState("empresa");
  return <Tabs defaultValue="empresa" value={activeTab} onValueChange={setActiveTab}>
      <div className="flex mb-8 overflow-x-auto">
        <TabsList className="grid grid-flow-col auto-cols-max gap-2">
          <TabsTrigger value="empresa" className="flex items-center gap-1">
            <UserCog className="h-4 w-4" />
            <span>Empresa</span>
          </TabsTrigger>
          <TabsTrigger value="sistema" className="flex items-center gap-1">
            <Settings className="h-4 w-4" />
            <span>Sistema</span>
          </TabsTrigger>
          <TabsTrigger value="financeiro" className="flex items-center gap-1">
            <DollarSign className="h-4 w-4" />
            <span>Financeiro</span>
          </TabsTrigger>
          <TabsTrigger value="clientes" className="flex items-center gap-1">
            <Truck className="h-4 w-4" />
            <span>Parâmetros</span>
          </TabsTrigger>
          <TabsTrigger value="producao" className="flex items-center gap-1">
            <BoxesIcon className="h-4 w-4" />
            <span>Produção</span>
          </TabsTrigger>
        </TabsList>
      </div>
      
      <TabsContent value="empresa">
        <EmpresaTab />
      </TabsContent>
      
      <TabsContent value="sistema">
        <SistemaTab />
      </TabsContent>
      
      <TabsContent value="financeiro">
        <FinanceiroTab />
      </TabsContent>
      
      <TabsContent value="clientes">
        <ClientesTab />
      </TabsContent>
      
      <TabsContent value="producao">
        <ProducaoTab />
      </TabsContent>
    </Tabs>;
}