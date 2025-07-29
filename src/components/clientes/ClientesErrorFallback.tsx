
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ClientesErrorFallbackProps {
  error: string;
  retryCount: number;
  onRetry: () => void;
  onClearError: () => void;
}

export default function ClientesErrorFallback({ 
  error, 
  retryCount, 
  onRetry, 
  onClearError 
}: ClientesErrorFallbackProps) {
  return (
    <div className="space-y-4">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Erro ao carregar clientes: {error}
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Falha no Carregamento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-8">
            <div className="text-muted-foreground mb-4">
              Não foi possível carregar a lista de clientes.
            </div>
            
            {retryCount > 0 && (
              <div className="text-sm text-muted-foreground mb-4">
                Tentativas realizadas: {retryCount}/3
              </div>
            )}
            
            <div className="flex gap-2 justify-center">
              <Button onClick={onRetry} variant="default" className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Tentar Novamente
              </Button>
              
              <Button onClick={onClearError} variant="outline">
                Limpar Erro
              </Button>
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded">
            <strong>Dicas para resolver:</strong>
            <ul className="mt-1 space-y-1">
              <li>• Verifique sua conexão com a internet</li>
              <li>• Tente atualizar a página (F5)</li>
              <li>• Se o problema persistir, contate o suporte</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
