import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Code, Database, Bug } from "lucide-react";

interface ErrorDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  error: any;
  context?: string;
}

export function ErrorDetailDialog({ open, onOpenChange, error, context }: ErrorDetailDialogProps) {
  const getErrorType = (error: any) => {
    if (error?.message?.includes('invalid input syntax for type json')) {
      return 'JSON_SYNTAX_ERROR';
    }
    if (error?.message?.includes('JWT expired')) {
      return 'AUTH_ERROR';
    }
    if (error?.code === 'PGRST301') {
      return 'AUTH_ERROR';
    }
    if (error?.message?.includes('duplicate key')) {
      return 'DUPLICATE_KEY';
    }
    if (error?.message?.includes('violates')) {
      return 'CONSTRAINT_VIOLATION';
    }
    return 'UNKNOWN_ERROR';
  };

  const getErrorExplanation = (errorType: string) => {
    switch (errorType) {
      case 'JSON_SYNTAX_ERROR':
        return {
          title: "Erro de Sintaxe JSON",
          description: "Os dados enviados para o banco não estão em formato JSON válido",
          causes: [
            "Campos como 'categorias_habilitadas' ou 'janelas_entrega' contêm dados malformados",
            "Caracteres especiais não escapados corretamente",
            "Arrays ou objetos JSON incompletos ou corrompidos",
            "Tradução automática do navegador alterando valores JSON"
          ],
          solutions: [
            "Verificar se todos os campos JSON são arrays válidos: []",
            "Limpar dados de formulário antes do envio",
            "Desabilitar tradução automática do navegador",
            "Reiniciar o formulário com dados limpos"
          ]
        };
      case 'AUTH_ERROR':
        return {
          title: "Erro de Autenticação",
          description: "Sua sessão expirou ou não tem permissões suficientes",
          causes: [
            "Token JWT expirado",
            "Sessão inválida ou corrompida",
            "Falta de permissões para a operação"
          ],
          solutions: [
            "Fazer logout e login novamente",
            "Atualizar a página",
            "Verificar se tem permissões de administrador"
          ]
        };
      case 'DUPLICATE_KEY':
        return {
          title: "Dados Duplicados",
          description: "Tentativa de criar registro com dados já existentes",
          causes: [
            "Email ou CNPJ/CPF já cadastrado",
            "Nome do cliente já existe",
            "Identificador único duplicado"
          ],
          solutions: [
            "Verificar se o cliente já existe",
            "Usar dados únicos",
            "Atualizar registro existente ao invés de criar novo"
          ]
        };
      default:
        return {
          title: "Erro Desconhecido",
          description: "Erro não categorizado detectado",
          causes: ["Erro interno do sistema", "Problema de conectividade", "Dados inválidos"],
          solutions: ["Tentar novamente", "Verificar conexão", "Contatar suporte técnico"]
        };
    }
  };

  const errorType = getErrorType(error);
  const explanation = getErrorExplanation(errorType);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Detalhes do Erro - Diagnóstico Técnico
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Resumo do Erro */}
            <Alert className="border-destructive/50">
              <Bug className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">{errorType}</Badge>
                    {context && <Badge variant="outline">{context}</Badge>}
                  </div>
                  <p className="font-medium">{explanation.title}</p>
                  <p className="text-sm text-muted-foreground">{explanation.description}</p>
                </div>
              </AlertDescription>
            </Alert>

            {/* Possíveis Causas */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Database className="h-4 w-4" />
                Possíveis Causas
              </h3>
              <ul className="space-y-2">
                {explanation.causes.map((cause, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="text-destructive mt-1">•</span>
                    <span>{cause}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Separator />

            {/* Soluções Sugeridas */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Code className="h-4 w-4" />
                Soluções Sugeridas
              </h3>
              <ol className="space-y-2">
                {explanation.solutions.map((solution, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <Badge variant="secondary" className="min-w-6 h-6 text-xs">
                      {index + 1}
                    </Badge>
                    <span>{solution}</span>
                  </li>
                ))}
              </ol>
            </div>

            <Separator />

            {/* Detalhes Técnicos */}
            <div className="space-y-3">
              <h3 className="font-semibold">Detalhes Técnicos</h3>
              <div className="bg-muted p-4 rounded-lg">
                <div className="space-y-2">
                  <div>
                    <span className="font-medium text-sm">Mensagem de erro:</span>
                    <p className="text-sm font-mono bg-background p-2 rounded border mt-1">
                      {error?.message || 'Mensagem não disponível'}
                    </p>
                  </div>
                  
                  {error?.code && (
                    <div>
                      <span className="font-medium text-sm">Código do erro:</span>
                      <p className="text-sm font-mono">{error.code}</p>
                    </div>
                  )}
                  
                  {error?.details && (
                    <div>
                      <span className="font-medium text-sm">Detalhes adicionais:</span>
                      <p className="text-sm font-mono bg-background p-2 rounded border mt-1">
                        {error.details}
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <span className="font-medium text-sm">Timestamp:</span>
                    <p className="text-sm">{new Date().toLocaleString('pt-BR')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Debug Info */}
            {process.env.NODE_ENV === 'development' && (
              <div className="space-y-3">
                <h3 className="font-semibold">Debug Info (Development)</h3>
                <div className="bg-muted p-4 rounded-lg">
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(error, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}