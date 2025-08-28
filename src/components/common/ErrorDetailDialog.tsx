import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Code, Database, Bug, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface ErrorDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  error: any;
  context?: string;
}

export function ErrorDetailDialog({ open, onOpenChange, error, context }: ErrorDetailDialogProps) {
  const [copied, setCopied] = useState(false);
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
          problem: "O sistema detectou dados JSON malformados, possivelmente causados por tradução automática do navegador que converteu valores válidos em tokens como 'customer_deleted', 'client_inactive', etc. Estes tokens não são valores válidos para os campos do sistema.",
          expected: "Os campos devem conter apenas valores válidos em português: 'Ativo', 'Inativo', 'Própria', 'Terceirizada', 'Boleto', etc. O sistema deve interceptar e corrigir automaticamente tokens traduzidos antes do envio ao banco.",
          causes: [
            "🌐 Tradução automática do navegador convertendo valores válidos em tokens ingleses",
            "📝 Campos como 'status_cliente' recebendo 'customer_deleted' ao invés de 'Inativo'",
            "🔄 Cache do navegador contendo dados corrompidos de sessões anteriores",
            "⚡ JavaScript sendo executado antes da tradução automática terminar",
            "🚨 Tokens problemáticos: customer_deleted, client_inactive, user_active, etc."
          ],
          solutions: [
            "🛡️ Usar o botão 'Reset Seguro' para limpar todos os campos problemáticos",
            "🌐 Desabilitar tradução automática: Chrome > Configurações > Idiomas > Nunca traduzir",
            "🔄 Limpar cache do navegador (Ctrl+Shift+Delete)",
            "📝 Recarregar a página e preencher o formulário novamente",
            "⚠️ Se persistir, usar modo anônimo/privado do navegador",
            "🔧 O sistema agora detecta e corrige automaticamente estes tokens"
          ]
        };
      case 'AUTH_ERROR':
        return {
          title: "Erro de Autenticação",
          description: "Sua sessão expirou ou não tem permissões suficientes",
          problem: "O token de autenticação JWT expirou ou é inválido, impedindo o acesso ao banco de dados",
          expected: "O sistema deve automaticamente renovar tokens expirados ou redirecionar para login quando necessário",
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
          problem: "O sistema está tentando inserir dados que violam restrições de unicidade no banco",
          expected: "O sistema deve verificar dados existentes antes da inserção e oferecer opção de atualizar ao invés de criar",
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
          problem: "Ocorreu um erro inesperado que não se enquadra nas categorias conhecidas",
          expected: "O sistema deve capturar e categorizar todos os tipos de erro possíveis",
          causes: ["Erro interno do sistema", "Problema de conectividade", "Dados inválidos"],
          solutions: ["Tentar novamente", "Verificar conexão", "Contatar suporte técnico"]
        };
    }
  };

  const errorType = getErrorType(error);
  const explanation = getErrorExplanation(errorType);

  const generateMarkdownReport = () => {
    const timestamp = new Date().toLocaleString('pt-BR');
    
    return `# Relatório de Erro - Diagnóstico Técnico

**Data/Hora:** ${timestamp}
**Contexto:** ${context || 'Não especificado'}
**Tipo de Erro:** ${errorType}

## 📋 Resumo do Problema

**${explanation.title}**

${explanation.description}

## 🚨 Problema Encontrado

${explanation.problem}

## ✅ Resultado Esperado

${explanation.expected}

## 🔍 Possíveis Causas

${explanation.causes.map((cause, index) => `${index + 1}. ${cause}`).join('\n')}

## 🛠️ Soluções Sugeridas

${explanation.solutions.map((solution, index) => `${index + 1}. ${solution}`).join('\n')}

## 🔧 Detalhes Técnicos

**Mensagem de erro:**
\`\`\`
${error?.message || 'Mensagem não disponível'}
\`\`\`

${error?.code ? `**Código do erro:** ${error.code}` : ''}

${error?.details ? `**Detalhes adicionais:**
\`\`\`
${error.details}
\`\`\`` : ''}

---
*Relatório gerado automaticamente pelo sistema de diagnóstico*`;
  };

  const copyToClipboard = async () => {
    try {
      const markdownReport = generateMarkdownReport();
      await navigator.clipboard.writeText(markdownReport);
      setCopied(true);
      toast.success('Relatório copiado para a área de transferência!', {
        description: 'O relatório completo em formato Markdown foi copiado.'
      });
      
      // Reset do ícone após 2 segundos
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Erro ao copiar relatório', {
        description: 'Não foi possível copiar para a área de transferência.'
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Detalhes do Erro - Diagnóstico Técnico
            </div>
            <Button
              onClick={copyToClipboard}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-green-600" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copiar Relatório
                </>
              )}
            </Button>
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

            {/* Problema vs Esperado */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2 text-destructive">
                  <Bug className="h-4 w-4" />
                  🚨 Problema Encontrado
                </h3>
                <div className="bg-destructive/5 border border-destructive/20 p-4 rounded-lg">
                  <p className="text-sm">{explanation.problem}</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2 text-green-600">
                  <Code className="h-4 w-4" />
                  ✅ Resultado Esperado
                </h3>
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <p className="text-sm">{explanation.expected}</p>
                </div>
              </div>
            </div>

            <Separator />

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