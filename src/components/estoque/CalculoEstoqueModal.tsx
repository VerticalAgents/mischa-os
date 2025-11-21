import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useExpedicaoStore } from "@/hooks/useExpedicaoStore";
import { useQuantidadesSeparadas } from "@/hooks/useQuantidadesSeparadas";
import { useEstoqueProdutos } from "@/hooks/useEstoqueProdutos";
import { useMovimentacoesEstoqueProdutos } from "@/hooks/useMovimentacoesEstoqueProdutos";
import { useMemo, useEffect, useState } from "react";

interface CalculoEstoqueModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CalculoEstoqueModal({ isOpen, onClose }: CalculoEstoqueModalProps) {
  const { produtos } = useEstoqueProdutos();
  const { obterSaldoProduto } = useMovimentacoesEstoqueProdutos();
  const { pedidos } = useExpedicaoStore();
  const [saldos, setSaldos] = useState<{ [produtoId: string]: number }>({});
  const [loadingSaldos, setLoadingSaldos] = useState(true);

  // Filtrar pedidos exatamente como no ResumoExpedicao
  const pedidosSeparados = useMemo(() => 
    pedidos.filter(p => p.substatus_pedido === 'Separado'), 
    [pedidos]
  );
  
  const pedidosDespachados = useMemo(() => 
    pedidos.filter(p => p.substatus_pedido === 'Despachado'), 
    [pedidos]
  );

  // Usar o mesmo hook que funciona no ProdutosEmExpedicao
  const { quantidadesPorProduto, calculando, obterQuantidadeProduto } = useQuantidadesSeparadas(
    pedidosSeparados, 
    pedidosDespachados
  );

  // Carregar saldos dos produtos
  useEffect(() => {
    const carregarSaldos = async () => {
      setLoadingSaldos(true);
      const saldosTemp: { [produtoId: string]: number } = {};
      
      for (const produto of produtos.filter(p => p.ativo)) {
        try {
          const saldo = await obterSaldoProduto(produto.id);
          saldosTemp[produto.id] = saldo;
        } catch (error) {
          console.error(`Erro ao carregar saldo do produto ${produto.nome}:`, error);
          saldosTemp[produto.id] = 0;
        }
      }
      
      setSaldos(saldosTemp);
      setLoadingSaldos(false);
    };

    if (produtos.length > 0) {
      carregarSaldos();
    }
  }, [produtos, obterSaldoProduto]);

  const getStatusEstoque = (saldoReal: number) => {
    if (saldoReal <= 0) return { variant: "destructive" as const, label: "Sem estoque" };
    if (saldoReal <= 10) return { variant: "secondary" as const, label: "Baixo" };
    if (saldoReal <= 50) return { variant: "outline" as const, label: "Médio" };
    return { variant: "default" as const, label: "Alto" };
  };

  // Calcular totais e produtos com cálculo correto
  const produtosAtivos = produtos.filter(p => p.ativo);
  const totalSaldoAtual = produtosAtivos.reduce((sum, p) => sum + (saldos[p.id] || 0), 0);
  
  // Total separado + despachado (quantidadesPorProduto já inclui ambos)
  const totalEmExpedicao = Object.values(quantidadesPorProduto).reduce((sum, qty) => sum + qty, 0);
  
  // Calcular saldo real correto usando os dados de expedição
  const produtosComCalculoCorreto = produtosAtivos.map(produto => {
    const saldoAtual = saldos[produto.id] || 0;
    const quantidadeEmExpedicao = obterQuantidadeProduto(produto.nome);
    const saldoReal = saldoAtual - quantidadeEmExpedicao;
    
    return {
      ...produto,
      saldoAtual,
      quantidadeEmExpedicao,
      saldoReal
    };
  });
  
  const totalSaldoReal = produtosComCalculoCorreto.reduce((sum, p) => sum + p.saldoReal, 0);
  
  const loading = calculando || loadingSaldos;

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
                ) : produtosComCalculoCorreto.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      Nenhum produto ativo encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  produtosComCalculoCorreto.map((produto) => {
                    const status = getStatusEstoque(produto.saldoReal);
                    
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
                            {produto.quantidadeEmExpedicao > 0 ? `-${produto.quantidadeEmExpedicao}` : '0'}
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