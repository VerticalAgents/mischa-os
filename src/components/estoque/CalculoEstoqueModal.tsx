import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useEstoqueComExpedicao } from "@/hooks/useEstoqueComExpedicao";
import { useEffect } from "react";

interface CalculoEstoqueModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CalculoEstoqueModal({ isOpen, onClose }: CalculoEstoqueModalProps) {
  const { produtos, loading, forcarRecarregamento } = useEstoqueComExpedicao();

  // Recarregar dados apenas quando o modal é aberto
  useEffect(() => {
    if (isOpen) {
      forcarRecarregamento();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const getStatusEstoque = (saldoReal: number) => {
    if (saldoReal <= 0) return { variant: "destructive" as const, label: "Sem estoque" };
    if (saldoReal <= 10) return { variant: "secondary" as const, label: "Baixo" };
    if (saldoReal <= 50) return { variant: "outline" as const, label: "Médio" };
    return { variant: "default" as const, label: "Alto" };
  };

  // Calcular totais usando os dados do hook
  const produtosAtivos = produtos.filter(p => p.ativo);
  const totalSaldoAtual = produtosAtivos.reduce((sum, p) => sum + p.saldoAtual, 0);
  const totalEmExpedicao = produtosAtivos.reduce((sum, p) => sum + p.quantidadeSeparada + p.quantidadeDespachada, 0);
  const totalSaldoReal = produtosAtivos.reduce((sum, p) => sum + p.saldoReal, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            🧮 Cálculo de Estoque Detalhado
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Resumo Geral */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="text-center">
              <div className="text-lg font-bold text-primary">{totalSaldoAtual}</div>
              <div className="text-sm text-muted-foreground">Saldo Atual</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-orange-600">-{totalEmExpedicao}</div>
              <div className="text-sm text-muted-foreground">Em Expedição</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">{totalSaldoReal}</div>
              <div className="text-sm text-muted-foreground">Saldo Real</div>
            </div>
          </div>

          <Separator />

          {/* Fórmula de Cálculo */}
          <div className="p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
            <h3 className="font-semibold mb-2">📊 Fórmula do Cálculo:</h3>
            <div className="text-center font-mono text-lg">
              <span className="text-primary font-bold">Saldo Real</span>
              {" = "}
              <span className="text-green-600">Saldo Atual</span>
              {" - "}
              <span className="text-orange-600">Em Expedição</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2 text-center">
              O Saldo Real representa a quantidade disponível para separação de novos pedidos. 
              "Em Expedição" inclui pedidos separados e despachados.
            </p>
          </div>

          {/* Tabela Detalhada */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-center">Saldo Atual</TableHead>
                  <TableHead className="text-center">Em Expedição</TableHead>
                  <TableHead className="text-center">Saldo Real</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      Carregando dados...
                    </TableCell>
                  </TableRow>
                ) : produtosAtivos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      Nenhum produto ativo encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  produtosAtivos.map((produto) => {
                    const status = getStatusEstoque(produto.saldoReal);
                    const quantidadeEmExpedicao = produto.quantidadeSeparada + produto.quantidadeDespachada;
                    
                    return (
                      <TableRow key={produto.id}>
                        <TableCell>
                          <div className="font-medium">{produto.nome}</div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-mono font-semibold text-green-600">
                            {produto.saldoAtual}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-mono font-semibold text-orange-600">
                            {quantidadeEmExpedicao > 0 ? `-${quantidadeEmExpedicao}` : '0'}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-mono font-bold text-lg">
                            {produto.saldoReal}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Legendas */}
          <div className="space-y-2 text-sm">
            <h4 className="font-semibold">📋 Definições:</h4>
            <ul className="space-y-1 text-muted-foreground">
              <li><span className="text-green-600 font-mono">Saldo Atual</span>: Estoque físico disponível no sistema</li>
              <li><span className="text-orange-600 font-mono">Em Expedição</span>: Total reservado para pedidos separados + despachados</li>
              <li><span className="font-mono">Saldo Real</span>: Quantidade efetivamente disponível para novos pedidos</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
