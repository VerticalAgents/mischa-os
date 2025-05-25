
import { useState, useEffect } from "react";
import { useSaborStore } from "@/hooks/useSaborStore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface EstoqueAjuste {
  idSabor: number;
  nomeSabor: string;
  estoqueAutomatico: number;
  estoqueManual?: number;
  observacao?: string;
  isManual: boolean;
}

export default function AjusteEstoqueTab() {
  const { sabores } = useSaborStore();
  const [estoqueAjustes, setEstoqueAjustes] = useState<EstoqueAjuste[]>([]);

  // Initialize stock adjustments from flavors
  useEffect(() => {
    const ajustes = sabores.map(sabor => ({
      idSabor: sabor.id,
      nomeSabor: sabor.nome,
      estoqueAutomatico: sabor.saldoAtual,
      estoqueManual: undefined,
      observacao: '',
      isManual: false
    }));
    setEstoqueAjustes(ajustes);
  }, [sabores]);

  // Update manual stock for a flavor
  const atualizarEstoqueManual = (idSabor: number, valor: number | undefined) => {
    setEstoqueAjustes(prev => prev.map(item => 
      item.idSabor === idSabor 
        ? { ...item, estoqueManual: valor, isManual: valor !== undefined }
        : item
    ));
  };

  // Update observation for a flavor
  const atualizarObservacao = (idSabor: number, observacao: string) => {
    setEstoqueAjustes(prev => prev.map(item => 
      item.idSabor === idSabor 
        ? { ...item, observacao }
        : item
    ));
  };

  // Reset to automatic value
  const usarValorSistema = (idSabor: number) => {
    setEstoqueAjustes(prev => prev.map(item => 
      item.idSabor === idSabor 
        ? { ...item, estoqueManual: undefined, isManual: false, observacao: '' }
        : item
    ));
  };

  // Check if any manual adjustments are active
  const hasManualAdjustments = estoqueAjustes.some(item => item.isManual);

  // Get effective stock value (manual if set, otherwise automatic)
  const getEstoqueEfetivo = (item: EstoqueAjuste) => {
    return item.isManual && item.estoqueManual !== undefined 
      ? item.estoqueManual 
      : item.estoqueAutomatico;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Ajuste de Estoque Manual</CardTitle>
              <CardDescription>
                Ajuste manualmente o estoque de produtos prontos
              </CardDescription>
            </div>
            {hasManualAdjustments && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                📌 Estoque manual ativo
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sabor</TableHead>
                  <TableHead className="text-right">Estoque Atual (Automático)</TableHead>
                  <TableHead className="text-right">Estoque Ajustado (Manual)</TableHead>
                  <TableHead className="text-right">Valor Efetivo</TableHead>
                  <TableHead>Observação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {estoqueAjustes.length > 0 ? (
                  estoqueAjustes.map((item) => (
                    <TableRow key={item.idSabor}>
                      <TableCell className="font-medium">{item.nomeSabor}</TableCell>
                      <TableCell className="text-right">
                        <span className="text-muted-foreground">
                          {item.estoqueAutomatico}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          value={item.estoqueManual ?? ''}
                          onChange={(e) => {
                            const valor = e.target.value === '' ? undefined : parseInt(e.target.value);
                            atualizarEstoqueManual(item.idSabor, valor);
                          }}
                          placeholder="Digite o valor manual"
                          className="w-32 text-right"
                          min="0"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className={`font-medium ${item.isManual ? 'text-blue-600' : 'text-muted-foreground'}`}>
                          {getEstoqueEfetivo(item)}
                          {item.isManual && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              Manual
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Textarea
                          value={item.observacao || ''}
                          onChange={(e) => atualizarObservacao(item.idSabor, e.target.value)}
                          placeholder="Observações (opcional)"
                          className="min-h-[60px] resize-none"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        {item.isManual && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => usarValorSistema(item.idSabor)}
                            className="flex items-center gap-1"
                          >
                            <RotateCcw className="h-3 w-3" />
                            Usar valor do sistema
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <AlertTriangle className="h-4 w-4" />
                        ⚠ Estoque indisponível ou desatualizado
                      </div>
                    </TableCell>
                  )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {hasManualAdjustments && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-800">Ajustes Manuais Ativos</h4>
                <p className="text-sm text-amber-700 mt-1">
                  Os valores manuais estão sendo utilizados no PCP. Os cálculos de Projeção de Produção 
                  e Necessidade Diária usarão esses valores ajustados.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
