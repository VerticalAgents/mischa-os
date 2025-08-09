
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  executarDiagnosticoBasico,
  verificarMovimentacoesEntrega,
  verificarHistoricoEntregas,
  DiagnosticoResultado
} from "@/utils/stockDeductionUtils";
import { AlertTriangle, CheckCircle, XCircle, Loader2 } from "lucide-react";

export const DiagnosticoEntrega = () => {
  const [resultados, setResultados] = useState<DiagnosticoResultado[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const executarDiagnostico = async () => {
    setIsLoading(true);
    try {
      const diagnostico = await executarDiagnosticoBasico();
      setResultados(diagnostico);
    } catch (error) {
      console.error('Erro no diagnóstico:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sucesso':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'erro':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'alerta':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  return (
    <Card className="p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Diagnóstico de Entregas</h3>
          <Button 
            onClick={executarDiagnostico}
            disabled={isLoading}
            size="sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Executando...
              </>
            ) : (
              'Executar Diagnóstico'
            )}
          </Button>
        </div>

        {resultados.length > 0 && (
          <div className="space-y-2">
            {resultados.map((resultado, index) => (
              <div key={index} className="flex items-start gap-3 p-3 border rounded">
                {getStatusIcon(resultado.status)}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{resultado.tipo}</span>
                    <Badge variant={resultado.status === 'sucesso' ? 'default' : 'destructive'}>
                      {resultado.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{resultado.mensagem}</p>
                  {resultado.detalhes && (
                    <details className="mt-2">
                      <summary className="text-xs cursor-pointer">Ver detalhes</summary>
                      <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto">
                        {JSON.stringify(resultado.detalhes, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};
