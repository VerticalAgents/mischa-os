
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Minus, TrendingDown, BarChart3, Search, Settings } from "lucide-react";
import { useEstoqueComExpedicao } from "@/hooks/useEstoqueComExpedicao";
import { useMovimentacoesEstoqueProdutos } from "@/hooks/useMovimentacoesEstoqueProdutos";
import MovimentacaoEstoqueModal from "../MovimentacaoEstoqueModal";
import BaixaEstoqueModal from "../BaixaEstoqueModal";
import HistoricoMovimentacoes from "../HistoricoMovimentacoes";
import CalculoEstoqueModal from "../CalculoEstoqueModal";

export default function EstoqueProdutosTab() {
  const { produtos, loading, carregarSaldos } = useEstoqueComExpedicao();
  const { movimentacoes, loading: loadingMovimentacoes, adicionarMovimentacao } = useMovimentacoesEstoqueProdutos();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [modalMovimentacao, setModalMovimentacao] = useState(false);
  const [modalBaixa, setModalBaixa] = useState(false);
  const [modalCalculos, setModalCalculos] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState<{id: string, nome: string} | null>(null);
  const [showHistorico, setShowHistorico] = useState<string | null>(null);

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

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Carregando dados de estoque...</div>
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
          <div className="flex items-center justify-between">
            <CardTitle>Controle de Estoque - Produtos</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setModalCalculos(true)}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              Cálculo de Estoque
            </Button>
          </div>
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
                  const status = getStatusEstoque(produto.saldoReal);
                  
                  return (
                    <TableRow key={produto.id}>
                      <TableCell>
                        <div className="font-medium">{produto.nome}</div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-mono font-semibold">{produto.saldoAtual}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-mono font-semibold">{produto.saldoReal}</span>
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
                            disabled={produto.saldoReal <= 0}
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
            saldoAtual={produtos.find(p => p.id === produtoSelecionado.id)?.saldoAtual || 0}
            onSuccess={handleCloseModal}
          />
        </>
      )}

      {/* Modal de Cálculo */}
      <CalculoEstoqueModal
        isOpen={modalCalculos}
        onClose={() => setModalCalculos(false)}
      />
    </div>
  );
}
