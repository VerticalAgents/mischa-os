
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bug, User, CreditCard, Receipt, Building } from "lucide-react";

interface DebugData {
  id: string;
  clienteNome: string;
  representante: string;
  tipoCobranca: string;
  formaPagamento: string;
  emiteNotaFiscal: boolean;
}

interface DebugEntregasModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  debugData: DebugData[];
}

export const DebugEntregasModal = ({ open, onOpenChange, debugData }: DebugEntregasModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            Debug - Dados das Entregas
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
            <p><strong>Total de entregas carregadas:</strong> {debugData.length}</p>
            <p><strong>Dados coletados:</strong> Nome do cliente, representante, tipo de cobrança, forma de pagamento e emissão de nota fiscal</p>
          </div>

          <div className="space-y-3">
            {debugData.map((entrega, index) => (
              <Card key={entrega.id} className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-mono">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    {entrega.clienteNome}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">Representante:</span>
                      <Badge variant={entrega.representante === 'Sem representante' ? 'destructive' : 'secondary'}>
                        {entrega.representante}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">Cobrança:</span>
                      <Badge variant="outline">{entrega.tipoCobranca}</Badge>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">Pagamento:</span>
                      <Badge variant="outline">{entrega.formaPagamento}</Badge>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Receipt className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">Nota Fiscal:</span>
                      <Badge variant={entrega.emiteNotaFiscal ? 'default' : 'secondary'}>
                        {entrega.emiteNotaFiscal ? 'SIM' : 'NÃO'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500 font-mono bg-gray-50 p-2 rounded">
                    ID: {entrega.id}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
