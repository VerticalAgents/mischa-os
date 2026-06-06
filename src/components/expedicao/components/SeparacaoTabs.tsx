
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import PedidoCard from "../PedidoCard";

interface SeparacaoTabsProps {
  activeSubTab: string;
  setActiveSubTab: (tab: string) => void;
  todosPedidos: any[];
  pedidosPadrao: any[];
  pedidosAlterados: any[];
  pedidosProximoDia: any[];
  converterPedidoParaCard: (pedido: any) => any;
  confirmarSeparacao: (pedidoId: string) => void;
  handleEditarAgendamento: (pedidoId: string) => void;
}

export const SeparacaoTabs = ({
  activeSubTab,
  setActiveSubTab,
  todosPedidos,
  pedidosPadrao,
  pedidosAlterados,
  pedidosProximoDia,
  converterPedidoParaCard,
  confirmarSeparacao,
  handleEditarAgendamento
}: SeparacaoTabsProps) => {
  return (
    <Tabs 
      defaultValue="todos" 
      value={activeSubTab}
      onValueChange={setActiveSubTab}
      className="w-full"
    >
      <TabsList className="mb-4 h-auto p-0 bg-transparent border-b border-border/60 rounded-none w-full justify-start gap-1">
        <TabsTrigger
          value="todos"
          className="rounded-none border-b-2 border-transparent bg-transparent px-3 py-2 text-[13px] font-medium text-foreground/60 shadow-none data-[state=active]:border-amber-500 data-[state=active]:text-amber-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none hover:text-foreground -mb-px"
        >
          Todos os Pedidos <span className="ml-1 text-muted-foreground tabular-nums">({todosPedidos.length})</span>
        </TabsTrigger>
        <TabsTrigger
          value="padrao"
          className="rounded-none border-b-2 border-transparent bg-transparent px-3 py-2 text-[13px] font-medium text-foreground/60 shadow-none data-[state=active]:border-amber-500 data-[state=active]:text-amber-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none hover:text-foreground -mb-px flex items-center gap-1.5"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
          Padrão <span className="ml-1 text-muted-foreground tabular-nums">({pedidosPadrao.length})</span>
        </TabsTrigger>
        <TabsTrigger
          value="alterados"
          className="rounded-none border-b-2 border-transparent bg-transparent px-3 py-2 text-[13px] font-medium text-foreground/60 shadow-none data-[state=active]:border-amber-500 data-[state=active]:text-amber-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none hover:text-foreground -mb-px flex items-center gap-1.5"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
          Alterados <span className="ml-1 text-muted-foreground tabular-nums">({pedidosAlterados.length})</span>
        </TabsTrigger>
        <TabsTrigger
          value="proximos"
          className="rounded-none border-b-2 border-transparent bg-transparent px-3 py-2 text-[13px] font-medium text-foreground/60 shadow-none data-[state=active]:border-amber-500 data-[state=active]:text-amber-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none hover:text-foreground -mb-px flex items-center gap-1.5"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
          Próximas <span className="ml-1 text-muted-foreground tabular-nums">({pedidosProximoDia.length})</span>
        </TabsTrigger>
      </TabsList>
      
      <TabsContent value="todos">
        {todosPedidos.length > 0 ? (
          <div className="space-y-4">
            {todosPedidos.map((pedido) => (
              <PedidoCard 
                key={pedido.id}
                pedido={converterPedidoParaCard(pedido)}
                onMarcarSeparado={() => confirmarSeparacao(pedido.id)}
                onEditarAgendamento={() => handleEditarAgendamento(pedido.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            Não há pedidos agendados para hoje.
          </div>
        )}
      </TabsContent>
      
      <TabsContent value="padrao">
        {pedidosPadrao.length > 0 ? (
          <div className="space-y-4">
            {pedidosPadrao.map((pedido) => (
              <PedidoCard 
                key={pedido.id}
                pedido={converterPedidoParaCard(pedido)}
                onMarcarSeparado={() => confirmarSeparacao(pedido.id)}
                onEditarAgendamento={() => handleEditarAgendamento(pedido.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            Não há pedidos padrão agendados para hoje.
          </div>
        )}
      </TabsContent>
      
      <TabsContent value="alterados">
        {pedidosAlterados.length > 0 ? (
          <div className="space-y-4">
            {pedidosAlterados.map((pedido) => (
              <PedidoCard 
                key={pedido.id}
                pedido={converterPedidoParaCard(pedido)}
                onMarcarSeparado={() => confirmarSeparacao(pedido.id)}
                onEditarAgendamento={() => handleEditarAgendamento(pedido.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            Não há pedidos alterados agendados para hoje.
          </div>
        )}
      </TabsContent>
      
      <TabsContent value="proximos">
        {pedidosProximoDia.length > 0 ? (
          <div className="space-y-4">
            {pedidosProximoDia.map((pedido) => (
              <PedidoCard 
                key={pedido.id}
                pedido={converterPedidoParaCard(pedido)}
                onMarcarSeparado={() => confirmarSeparacao(pedido.id)}
                onEditarAgendamento={() => handleEditarAgendamento(pedido.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            Não há pedidos pendentes para separação antecipada.
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
};
