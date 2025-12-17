import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileText, Receipt, FileCheck, Printer, Download } from "lucide-react";

interface AcoesMassaGCProps {
  totalVendas: number;
  pendentesA4: number;
  pendentesBoleto: number;
  pendentesNF: number;
  tudoGerado: boolean;
  onGerarTodosA4: () => void;
  onGerarTodosBoletos: () => void;
  onGerarTodasNFs: () => void;
  onImprimirTodos: () => void;
}

export function AcoesMassaGC({
  totalVendas,
  pendentesA4,
  pendentesBoleto,
  pendentesNF,
  tudoGerado,
  onGerarTodosA4,
  onGerarTodosBoletos,
  onGerarTodasNFs,
  onImprimirTodos
}: AcoesMassaGCProps) {
  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1">
          <h3 className="font-semibold">Ações em Massa</h3>
          <p className="text-sm text-muted-foreground">
            {totalVendas} venda{totalVendas !== 1 ? 's' : ''} pendente{totalVendas !== 1 ? 's' : ''} de confirmação
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {pendentesA4 > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={onGerarTodosA4}
              className="gap-1.5"
            >
              <FileText className="h-4 w-4" />
              Gerar Docs A4
              <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium">
                {pendentesA4}
              </span>
            </Button>
          )}

          {pendentesBoleto > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={onGerarTodosBoletos}
              className="gap-1.5"
            >
              <Receipt className="h-4 w-4" />
              Gerar Boletos
              <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium">
                {pendentesBoleto}
              </span>
            </Button>
          )}

          {pendentesNF > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={onGerarTodasNFs}
              className="gap-1.5"
            >
              <FileCheck className="h-4 w-4" />
              Gerar NFs
              <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium">
                {pendentesNF}
              </span>
            </Button>
          )}

          {tudoGerado && totalVendas > 0 && (
            <Button
              variant="default"
              size="sm"
              onClick={onImprimirTodos}
              className="gap-1.5 bg-green-600 hover:bg-green-700"
            >
              <Printer className="h-4 w-4" />
              Imprimir Todos
              <Download className="h-3 w-3 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
