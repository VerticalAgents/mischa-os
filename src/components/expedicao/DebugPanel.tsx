
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Trash2, RefreshCw } from "lucide-react";
import { useExpedicaoStore } from "@/hooks/useExpedicaoStore";

export const DebugPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { debugLogs, clearDebugLogs, carregarPedidos } = useExpedicaoStore();

  return (
    <Card className="border-orange-200 bg-orange-50">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-orange-100 transition-colors">
            <CardTitle className="flex items-center justify-between text-orange-800">
              <span>🔍 Debug - Sincronização de Datas ({debugLogs.length} logs)</span>
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button 
                onClick={carregarPedidos} 
                size="sm" 
                variant="outline"
                className="flex items-center gap-1"
              >
                <RefreshCw className="h-4 w-4" />
                Recarregar Dados
              </Button>
              <Button 
                onClick={clearDebugLogs} 
                size="sm" 
                variant="outline"
                className="flex items-center gap-1"
              >
                <Trash2 className="h-4 w-4" />
                Limpar Logs
              </Button>
            </div>
            
            <ScrollArea className="h-64 w-full border rounded p-2 bg-white">
              {debugLogs.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Nenhum log disponível. Clique em "Recarregar Dados" para gerar logs.
                </p>
              ) : (
                <div className="space-y-1">
                  {debugLogs.map((log, index) => (
                    <div 
                      key={index} 
                      className="text-xs font-mono p-1 rounded bg-gray-50 border-l-2 border-orange-300"
                    >
                      {log}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
            
            <div className="text-xs text-orange-700 bg-orange-100 p-2 rounded">
              <strong>ℹ️ Informações:</strong>
              <ul className="mt-1 ml-4 list-disc">
                <li>Este painel exibe logs detalhados da sincronização entre Agendamento e Expedição</li>
                <li>Logs incluem conversão de datas, filtros aplicados e decisões de exibição</li>
                <li>Use para identificar inconsistências entre datas agendadas e exibidas</li>
              </ul>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
