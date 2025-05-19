
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import PageHeader from "@/components/common/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { usePedidoStore } from "@/hooks/usePedidoStore";
import { useClienteStore } from "@/hooks/cliente";
import { Calendar, ClipboardList, PhoneCall } from "lucide-react";
import ConfirmacaoReposicaoTab from "@/components/agendamento/ConfirmacaoReposicaoTab";

export default function Agendamento() {
  const [searchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || "calendario");
  
  const { pedidos } = usePedidoStore();
  const { clientes } = useClienteStore();
  
  // Update active tab when URL params change
  useEffect(() => {
    if (tabParam && ["calendario", "pedidos", "confirmacao"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);
  
  return (
    <>
      <PageHeader 
        title="Agendamento" 
        description="Calendário de agendamentos e confirmação de reposições"
        icon={<Calendar className="h-5 w-5" />}
      />
      
      <div className="mt-8">
        <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8">
            <TabsTrigger value="calendario" className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>Calendário</span>
            </TabsTrigger>
            <TabsTrigger value="pedidos" className="flex items-center gap-1">
              <ClipboardList className="h-4 w-4" />
              <span>Pedidos</span>
            </TabsTrigger>
            <TabsTrigger value="confirmacao" className="flex items-center gap-1">
              <PhoneCall className="h-4 w-4" />
              <span>Confirmação de Reposição</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="calendario">
            <div className="text-center py-10">
              <h3 className="text-xl font-semibold mb-2">Módulo em Desenvolvimento</h3>
              <p className="text-muted-foreground">
                O calendário de agendamentos será implementado em breve.
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="pedidos">
            <div className="text-center py-10">
              <h3 className="text-xl font-semibold mb-2">Módulo em Desenvolvimento</h3>
              <p className="text-muted-foreground">
                A listagem de pedidos agendados será implementada em breve.
              </p>
            </div>
          </TabsContent>
          
          <ConfirmacaoReposicaoTab />
        </Tabs>
      </div>
    </>
  );
}
