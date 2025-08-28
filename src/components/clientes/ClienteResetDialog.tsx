import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw, AlertTriangle } from "lucide-react";
import { createSafeClienteDefaults } from "@/utils/clienteDataSanitizer";
import { Cliente } from "@/types";

interface ClienteResetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReset: (safeData: Partial<Cliente>) => void;
  clienteAtual?: Cliente | null;
}

export function ClienteResetDialog({ 
  open, 
  onOpenChange, 
  onReset, 
  clienteAtual 
}: ClienteResetDialogProps) {
  const handleReset = () => {
    const safeDefaults = createSafeClienteDefaults();
    
    // Manter apenas dados essenciais não corrompidos
    const resetData = {
      ...safeDefaults,
      // Preservar dados que sabemos estar seguros
      nome: clienteAtual?.nome || '',
      enderecoEntrega: clienteAtual?.enderecoEntrega || '',
      linkGoogleMaps: clienteAtual?.linkGoogleMaps || '',
      contatoNome: clienteAtual?.contatoNome || '',
      contatoTelefone: clienteAtual?.contatoTelefone || '',
      contatoEmail: clienteAtual?.contatoEmail || '',
      id: clienteAtual?.id
    };
    
    onReset(resetData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-warning" />
            Reset de Segurança
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">Esta ação irá:</p>
                <ul className="text-sm space-y-1 ml-4">
                  <li>• Restaurar todos os campos para valores seguros padrão</li>
                  <li>• Preservar apenas dados essenciais (nome, endereço, contatos)</li>
                  <li>• Limpar completamente campos problemáticos</li>
                  <li>• Permitir salvamento garantido sem erros</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>

          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm font-medium mb-2">Valores que serão definidos:</p>
            <div className="text-xs space-y-1 text-muted-foreground">
              <div>• Status: Ativo</div>
              <div>• Logística: Própria</div>
              <div>• Cobrança: À vista</div>
              <div>• Pagamento: Boleto</div>
              <div>• Categorias: [] (limpo)</div>
              <div>• Janelas de entrega: [] (limpo)</div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleReset} className="bg-warning hover:bg-warning/90">
            Aplicar Reset
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}