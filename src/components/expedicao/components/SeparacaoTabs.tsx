
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
  desfazerSeparacao: (pedidoId: string) => Promise<void>;
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
  handleEditarAgendamento,
  desfazerSeparacao
}: SeparacaoTabsProps) => {
  return (
    <Tabs 
      defaultValue="todos" 
      value={activeSubTab}
      onValueChange={setActiveSubTab}
      className="w-full"
    >
      <TabsList className="mb-4">
        <TabsTrigger value="todos">Todos os Pedidos ({todosPedidos.length})</TabsTrigger>
        <TabsTrigger value="padrao" className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-green-500"></span> Pedidos Padrão ({pedidosPadrao.length})
        </TabsTrigger>
        <TabsTrigger value="alterados" className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-red-500"></span> Pedidos Alterados ({pedidosAlterados.length})
        </TabsTrigger>
        <TabsTrigger value="proximos" className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-blue-500"></span> Próximas Separações ({pedidosProximoDia.length})
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
                onDesfazerSeparacao={() => desfazerSeparacao(pedido.id)}
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
                onDesfazerSeparacao={() => desfazerSeparacao(pedido.id)}
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
                onDesfazerSeparacao={() => desfazerSeparacao(pedido.id)}
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
                onDesfazerSeparacao={() => desfazerSeparacao(pedido.id)}
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
