
import { useState, useEffect } from "react";
import { useSupabaseProdutos } from "@/hooks/useSupabaseProdutos";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface EstoqueAjuste {
  id: string;
  nome: string;
  estoqueAutomatico: number;
  estoqueManual?: number;
  observacao?: string;
  isManual: boolean;
}

export default function AjusteEstoqueTab() {
  const { produtos, loading, carregarProdutos } = useSupabaseProdutos();
  const [estoqueAjustes, setEstoqueAjustes] = useState<EstoqueAjuste[]>([]);
  const [salvandoEstoque, setSalvandoEstoque] = useState<string | null>(null);

  // Initialize stock adjustments from products
  useEffect(() => {
    const ajustes = produtos.map(produto => ({
      id: produto.id,
      nome: produto.nome,
      estoqueAutomatico: produto.estoque_atual || 0,
      estoqueManual: undefined,
      observacao: '',
      isManual: false
    }));
    setEstoqueAjustes(ajustes);
  }, [produtos]);

  // Update manual stock for a product
  const atualizarEstoqueManual = (id: string, valor: number | undefined) => {
    setEstoqueAjustes(prev => prev.map(item => 
      item.id === id 
        ? { ...item, estoqueManual: valor, isManual: valor !== undefined }
        : item
    ));
  };

  // Update observation for a product
  const atualizarObservacao = (id: string, observacao: string) => {
    setEstoqueAjustes(prev => prev.map(item => 
      item.id === id 
        ? { ...item, observacao }
        : item
    ));
  };

  // Reset to automatic value
  const usarValorSistema = (id: string) => {
    setEstoqueAjustes(prev => prev.map(item => 
      item.id === id 
        ? { ...item, estoqueManual: undefined, isManual: false, observacao: '' }
        : item
    ));
  };

  // Save manual adjustment to database
  const salvarAjusteEstoque = async (item: EstoqueAjuste) => {
    if (!item.isManual || item.estoqueManual === undefined) return;
    
    setSalvandoEstoque(item.id);
    
    try {
      // Update stock in database
      const { error } = await supabase
        .from('produtos_finais')
        .update({ 
          estoque_atual: item.estoqueManual
        })
        .eq('id', item.id);

      if (error) {
        toast.error("Erro ao salvar ajuste de estoque");
        console.error("Erro ao salvar estoque:", error);
        return;
      }

      // Register movement if there's an observation
      if (item.observacao?.trim()) {
        const diferenca = item.estoqueManual - item.estoqueAutomatico;
        
        await supabase
          .from('movimentacoes_estoque_produtos')
          .insert({
            produto_id: item.id,
            tipo: diferenca >= 0 ? 'entrada' : 'saida',
            quantidade: Math.abs(diferenca),
            observacao: `Ajuste PCP: ${item.observacao}`,
          });
      }

      toast.success(`Estoque de ${item.nome} atualizado com sucesso`);
      
      // Reload products to get updated data
      await carregarProdutos();
      
      // Reset manual adjustment for this item
      usarValorSistema(item.id);
      
    } catch (error) {
      console.error('Erro ao salvar ajuste:', error);
      toast.error("Erro inesperado ao salvar ajuste");
    } finally {
      setSalvandoEstoque(null);
    }
  };

  // Check if any manual adjustments are active
  const hasManualAdjustments = estoqueAjustes.some(item => item.isManual);

  // Get effective stock value (manual if set, otherwise automatic)
  const getEstoqueEfetivo = (item: EstoqueAjuste) => {
    return item.isManual && item.estoqueManual !== undefined 
      ? item.estoqueManual 
      : item.estoqueAutomatico;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            Carregando produtos...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Ajuste de Estoque Manual</CardTitle>
              <CardDescription>
                Ajuste manualmente o estoque de produtos acabados
              </CardDescription>
            </div>
            {hasManualAdjustments && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                📌 Ajustes pendentes
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-right">Estoque Atual (Sistema)</TableHead>
                  <TableHead className="text-right">Estoque Ajustado (Manual)</TableHead>
                  <TableHead className="text-right">Valor Efetivo</TableHead>
                  <TableHead>Observação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {estoqueAjustes.length > 0 ? (
                  estoqueAjustes.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.nome}</TableCell>
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
                            atualizarEstoqueManual(item.id, valor);
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
                          onChange={(e) => atualizarObservacao(item.id, e.target.value)}
                          placeholder="Observações (opcional)"
                          className="min-h-[60px] resize-none"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2">
                          {item.isManual && (
                            <>
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => salvarAjusteEstoque(item)}
                                disabled={salvandoEstoque === item.id}
                                className="flex items-center gap-1"
                              >
                                <Save className="h-3 w-3" />
                                {salvandoEstoque === item.id ? 'Salvando...' : 'Salvar'}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => usarValorSistema(item.id)}
                                className="flex items-center gap-1"
                              >
                                <RotateCcw className="h-3 w-3" />
                                Cancelar
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <AlertTriangle className="h-4 w-4" />
                        Nenhum produto encontrado
                      </div>
                    </TableCell>
                  </TableRow>
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
                <h4 className="font-medium text-amber-800">Ajustes Manuais Pendentes</h4>
                <p className="text-sm text-amber-700 mt-1">
                  Você tem ajustes manuais pendentes. Clique em "Salvar" para aplicar os ajustes ao estoque real.
                  Os valores ajustados serão refletidos automaticamente na aba de Estoque de Produtos Acabados.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
