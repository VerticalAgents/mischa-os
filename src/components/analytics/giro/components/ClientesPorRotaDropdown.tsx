
import { useState } from 'react';
import { ChevronDown, ChevronUp, MapPin, User, Phone, Mail } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DadosAnaliseGiroConsolidados } from '@/types/giroAnalysis';

interface ClientesPorRotaDropdownProps {
  rota: string;
  dadosConsolidados: DadosAnaliseGiroConsolidados[];
  isOpen: boolean;
  onToggle: () => void;
}

export function ClientesPorRotaDropdown({ 
  rota, 
  dadosConsolidados, 
  isOpen, 
  onToggle 
}: ClientesPorRotaDropdownProps) {
  const clientesDaRota = dadosConsolidados.filter(
    cliente => cliente.rota_entrega_nome === rota
  );

  const getSemaforoColor = (semaforo: string) => {
    switch (semaforo) {
      case 'verde': return 'bg-green-500';
      case 'amarelo': return 'bg-yellow-500';
      case 'vermelho': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="w-full">
      <div 
        onClick={onToggle}
        className="flex items-center justify-between p-4 hover:bg-muted/50 cursor-pointer transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100">
            <MapPin className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <h3 className="font-medium text-left">{rota}</h3>
            <p className="text-sm text-muted-foreground text-left">
              {clientesDaRota.length} cliente{clientesDaRota.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Giro Médio</div>
            <div className="font-medium">
              {(clientesDaRota.reduce((acc, c) => acc + c.giro_medio_historico, 0) / clientesDaRota.length).toFixed(1)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Achievement</div>
            <div className="font-medium">
              {(clientesDaRota.reduce((acc, c) => acc + c.achievement_meta, 0) / clientesDaRota.length).toFixed(1)}%
            </div>
          </div>
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </div>

      {isOpen && (
        <div className="border-t bg-muted/20">
          <div className="p-4 space-y-3">
            {clientesDaRota.map((cliente) => (
              <Card key={cliente.cliente_id} className="p-3">
                <CardContent className="p-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100">
                        <User className="h-3 w-3 text-gray-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-sm text-left">{cliente.cliente_nome}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          {cliente.contato_telefone && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {cliente.contato_telefone}
                            </div>
                          )}
                          {cliente.contato_email && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {cliente.contato_email}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">Giro</div>
                        <div className="text-sm font-medium">{cliente.giro_medio_historico}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">Achievement</div>
                        <div className="text-sm font-medium">{cliente.achievement_meta}%</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div 
                          className={`w-3 h-3 rounded-full ${getSemaforoColor(cliente.semaforo_performance)}`}
                          title={`Performance: ${cliente.semaforo_performance}`}
                        />
                        <Badge variant="outline" className="text-xs">
                          {cliente.status_cliente}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
