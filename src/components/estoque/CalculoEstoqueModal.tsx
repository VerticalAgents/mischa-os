import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useEstoqueComExpedicao } from "@/hooks/useEstoqueComExpedicao";
import { useExpedicaoStore } from "@/hooks/useExpedicaoStore";
import { useQuantidadesExpedicao } from "@/hooks/useQuantidadesExpedicao";
import { useMemo } from "react";

interface CalculoEstoqueModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CalculoEstoqueModal({ isOpen, onClose }: CalculoEstoqueModalProps) {
  const { produtos, loading } = useEstoqueComExpedicao();
  const { getPedidosParaSeparacao, getPedidosParaDespacho } = useExpedicaoStore();

  // Obter os pedidos para calcular as quantidades corretamente
  const pedidosSeparacao = useMemo(() => getPedidosParaSeparacao(), [getPedidosParaSeparacao]);
  const pedidosDespacho = useMemo(() => getPedidosParaDespacho(), [getPedidosParaDespacho]);
  
  const pedidosSeparados = useMemo(() => 
    pedidosSeparacao.filter(p => p.substatus_pedido === 'Separado'), 
    [pedidosSeparacao]
  );
  
  const pedidosDespachados = useMemo(() => 
    pedidosDespacho.filter(p => p.substatus_pedido === 'Despachado'), 
    [pedidosDespacho]
  );

  // Usar o mesmo hook que funciona no ResumoUnidadesSeparadas
  const { quantidadesSeparadas, quantidadesDespachadas } = useQuantidadesExpedicao(
    pedidosSeparados, 
    pedidosDespachados
  );

  const getStatusEstoque = (saldoReal: number) => {
    if (saldoReal <= 0) return { variant: "destructive" as const, label: "Sem estoque" };
    if (saldoReal <= 10) return { variant: "secondary" as const, label: "Baixo" };
    if (saldoReal <= 50) return { variant: "outline" as const, label: "Médio" };
    return { variant: "default" as const, label: "Alto" };
  };

  // Calcular totais usando as quantidades corretas do hook de expedição
  const produtosAtivos = produtos.filter(p => p.ativo);
  const totalSaldoAtual = produtosAtivos.reduce((sum, p) => sum + p.saldoAtual, 0);
  const totalSeparado = Object.values(quantidadesSeparadas).reduce((sum, qty) => sum + qty, 0);
  const totalDespachado = Object.values(quantidadesDespachadas).reduce((sum, qty) => sum + qty, 0);
  
  // Calcular saldo real correto usando os dados de expedição
  const produtosComCalculoCorreto = produtosAtivos.map(produto => {
    const quantidadeSeparada = quantidadesSeparadas[produto.nome] || 0;
    const quantidadeDespachada = quantidadesDespachadas[produto.nome] || 0;
    const saldoReal = produto.saldoAtual - quantidadeSeparada - quantidadeDespachada;
    
    return {
      ...produto,
      quantidadeSeparada,
      quantidadeDespachada,
      saldoReal
    };
  });
  
  const totalSaldoReal = produtosComCalculoCorreto.reduce((sum, p) => sum + p.saldoReal, 0);

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
          <div className="grid grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="text-center">
              <div className="text-lg font-bold text-primary">{totalSaldoAtual}</div>
              <div className="text-sm text-muted-foreground">Saldo Atual</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-orange-600">-{totalSeparado}</div>
              <div className="text-sm text-muted-foreground">Separado</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">-{totalDespachado}</div>
              <div className="text-sm text-muted-foreground">Despachado</div>
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
              <span className="text-orange-600">Separado</span>
              {" - "}
              <span className="text-blue-600">Despachado</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2 text-center">
              O Saldo Real representa a quantidade disponível para separação de novos pedidos
            </p>
          </div>

          {/* Tabela Detalhada */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-center">Saldo Atual</TableHead>
                  <TableHead className="text-center">Separado</TableHead>
                  <TableHead className="text-center">Despachado</TableHead>
                  <TableHead className="text-center">Saldo Real</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Carregando dados...
                    </TableCell>
                  </TableRow>
                ) : produtosComCalculoCorreto.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
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
                            {produto.quantidadeSeparada > 0 ? `-${produto.quantidadeSeparada}` : '0'}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="font-mono font-semibold text-blue-600">
                            {produto.quantidadeDespachada > 0 ? `-${produto.quantidadeDespachada}` : '0'}
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
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <h4 className="font-semibold">📋 Definições:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li><span className="text-green-600 font-mono">Saldo Atual</span>: Estoque físico disponível</li>
                <li><span className="text-orange-600 font-mono">Separado</span>: Reservado para pedidos já separados</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">🚀 Status:</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li><span className="text-blue-600 font-mono">Despachado</span>: Reservado para pedidos despachados</li>
                <li><span className="font-mono">Saldo Real</span>: Disponível para novos pedidos</li>
              </ul>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}