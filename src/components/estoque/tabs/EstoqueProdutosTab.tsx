
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Minus, TrendingDown, BarChart3, Search } from "lucide-react";
import { useSupabaseProdutos } from "@/hooks/useSupabaseProdutos";
import { useMovimentacoesEstoqueProdutos } from "@/hooks/useMovimentacoesEstoqueProdutos";
import { useExpedicaoStore } from "@/hooks/useExpedicaoStore";
import { useQuantidadesSeparadas } from "@/hooks/useQuantidadesSeparadas";
import MovimentacaoEstoqueModal from "../MovimentacaoEstoqueModal";
import BaixaEstoqueModal from "../BaixaEstoqueModal";
import HistoricoMovimentacoes from "../HistoricoMovimentacoes";

export default function EstoqueProdutosTab() {
  const { produtos, loading: loadingProdutos } = useSupabaseProdutos();
  const { movimentacoes, loading: loadingMovimentacoes, adicionarMovimentacao, obterSaldoProduto } = useMovimentacoesEstoqueProdutos();
  const { getPedidosParaSeparacao, getPedidosParaDespacho } = useExpedicaoStore();
  
  // Obter pedidos separados e despachados
  const pedidosSeparados = getPedidosParaSeparacao().filter(p => p.substatus_pedido === 'Separado');
  const pedidosDespachados = getPedidosParaDespacho().filter(p => p.substatus_pedido === 'Despachado');
  
  // Usar o hook para calcular quantidades separadas
  const { quantidadesPorProduto } = useQuantidadesSeparadas(pedidosSeparados, pedidosDespachados);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [saldos, setSaldos] = useState<Record<string, number>>({});
  const [modalMovimentacao, setModalMovimentacao] = useState(false);
  const [modalBaixa, setModalBaixa] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState<{id: string, nome: string} | null>(null);
  const [showHistorico, setShowHistorico] = useState<string | null>(null);

  // Carregar saldos dos produtos
  const carregarSaldos = async () => {
    const novosSaldos: Record<string, number> = {};

    for (const produto of produtos) {
      try {
        const saldo = await obterSaldoProduto(produto.id);
        novosSaldos[produto.id] = saldo;
      } catch (error) {
        console.error(`Erro ao obter saldo do produto ${produto.nome}:`, error);
        novosSaldos[produto.id] = 0;
      }
    }

    setSaldos(novosSaldos);
  };

  useEffect(() => {
    if (produtos.length > 0) {
      carregarSaldos();
    }
  }, [produtos]);

  // Filtrar produtos
  const produtosFiltrados = produtos.filter(produto =>
    produto.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Entrada rápida
  const entradaRapida = async (produtoId: string, quantidade: number) => {
    const sucesso = await adicionarMovimentacao({
      produto_id: produtoId,
      tipo: 'entrada',
      quantidade: Math.abs(quantidade),
      data_movimentacao: new Date().toISOString(),
      observacao: `Entrada rápida de ${Math.abs(quantidade)} unidades`
    });

    if (sucesso) {
      await carregarSaldos();
    }
  };

  const handleModalMovimentacao = (produto: any) => {
    setProdutoSelecionado({ id: produto.id, nome: produto.nome });
    setModalMovimentacao(true);
  };

  const handleModalBaixa = (produto: any) => {
    setProdutoSelecionado({ id: produto.id, nome: produto.nome });
    setModalBaixa(true);
  };

  const handleCloseModal = () => {
    setModalMovimentacao(false);
    setModalBaixa(false);
    setProdutoSelecionado(null);
    carregarSaldos();
  };

  const getStatusEstoque = (saldo: number) => {
    if (saldo <= 0) return { variant: "destructive" as const, label: "Sem estoque" };
    if (saldo <= 10) return { variant: "secondary" as const, label: "Baixo" };
    if (saldo <= 50) return { variant: "outline" as const, label: "Médio" };
    return { variant: "default" as const, label: "Alto" };
  };

  const movimentacoesProdutoSelecionado = showHistorico 
    ? movimentacoes.filter(mov => mov.produto_id === showHistorico)
    : [];

  if (loadingProdutos) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Carregando produtos...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros e busca */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar produtos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabela de produtos */}
      <Card>
        <CardHeader>
          <CardTitle>Controle de Estoque - Produtos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead className="text-center">Saldo Atual</TableHead>
                <TableHead className="text-center">Saldo Real</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {produtosFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">
                    {searchTerm ? "Nenhum produto encontrado" : "Nenhum produto cadastrado"}
                  </TableCell>
                </TableRow>
              ) : (
                produtosFiltrados.map((produto) => {
                  const saldo = saldos[produto.id] || 0;
                  const quantidadeSeparada = quantidadesPorProduto[produto.nome] || 0;
                  const saldoReal = saldo - quantidadeSeparada;
                  const status = getStatusEstoque(saldoReal);
                  
                  return (
                    <TableRow key={produto.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{produto.nome}</div>
                          {produto.descricao && (
                            <div className="text-sm text-muted-foreground">{produto.descricao}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-mono font-semibold">{saldo.toFixed(0)}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-mono font-semibold">{saldoReal.toFixed(0)}</span>
                        {quantidadeSeparada > 0 && (
                          <div className="text-xs text-muted-foreground">
                            (-{quantidadeSeparada.toFixed(0)} separado)
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => entradaRapida(produto.id, 1)}
                            title="Entrada rápida (+1)"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleModalBaixa(produto)}
                            disabled={saldoReal <= 0}
                            title="Baixa de estoque"
                          >
                            <TrendingDown className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleModalMovimentacao(produto)}
                            title="Nova movimentação"
                          >
                            Movimentar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowHistorico(showHistorico === produto.id ? null : produto.id)}
                            title="Ver histórico"
                          >
                            <BarChart3 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Histórico do produto selecionado */}
      {showHistorico && (
        <HistoricoMovimentacoes
          itemId={showHistorico}
          itemNome={produtos.find(p => p.id === showHistorico)?.nome || "Produto"}
          tipoItem="produto"
          movimentacoes={movimentacoesProdutoSelecionado}
          loading={loadingMovimentacoes}
        />
      )}

      {/* Modais */}
      {produtoSelecionado && (
        <>
          <MovimentacaoEstoqueModal
            isOpen={modalMovimentacao}
            onClose={handleCloseModal}
            itemId={produtoSelecionado.id}
            itemNome={produtoSelecionado.nome}
            tipoItem="produto"
            onSuccess={handleCloseModal}
          />
          
          <BaixaEstoqueModal
            isOpen={modalBaixa}
            onClose={handleCloseModal}
            itemId={produtoSelecionado.id}
            itemNome={produtoSelecionado.nome}
            tipoItem="produto"
            saldoAtual={saldos[produtoSelecionado.id] || 0}
            onSuccess={handleCloseModal}
          />
        </>
      )}
    </div>
  );
}
