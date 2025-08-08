
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, TrendingDown, BarChart3, Search } from "lucide-react";
import { useSupabaseInsumos } from "@/hooks/useSupabaseInsumos";
import { useMovimentacoesEstoqueInsumos } from "@/hooks/useMovimentacoesEstoqueInsumos";
import MovimentacaoEstoqueModal from "../MovimentacaoEstoqueModal";
import BaixaEstoqueModal from "../BaixaEstoqueModal";
import HistoricoMovimentacoes from "../HistoricoMovimentacoes";

export default function EstoqueInsumosTab() {
  const { insumos, loading: loadingInsumos } = useSupabaseInsumos();
  const { movimentacoes, loading: loadingMovimentacoes, adicionarMovimentacao, obterSaldoInsumo } = useMovimentacoesEstoqueInsumos();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [saldos, setSaldos] = useState<Record<string, number>>({});
  const [modalMovimentacao, setModalMovimentacao] = useState(false);
  const [modalBaixa, setModalBaixa] = useState(false);
  const [insumoSelecionado, setInsumoSelecionado] = useState<{id: string, nome: string} | null>(null);
  const [showHistorico, setShowHistorico] = useState<string | null>(null);

  // Carregar saldos dos insumos
  const carregarSaldos = async () => {
    const novosSaldos: Record<string, number> = {};
    for (const insumo of insumos) {
      const saldo = await obterSaldoInsumo(insumo.id);
      novosSaldos[insumo.id] = saldo;
    }
    setSaldos(novosSaldos);
  };

  useEffect(() => {
    if (insumos.length > 0) {
      carregarSaldos();
    }
  }, [insumos]);

  // Filtrar insumos
  const insumosFiltrados = insumos.filter(insumo =>
    insumo.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Entrada rápida
  const entradaRapida = async (insumoId: string, quantidade: number) => {
    const sucesso = await adicionarMovimentacao({
      insumo_id: insumoId,
      tipo: 'entrada',
      quantidade: Math.abs(quantidade),
      data_movimentacao: new Date().toISOString(),
      observacao: `Entrada rápida de ${Math.abs(quantidade)} unidades`
    });

    if (sucesso) {
      await carregarSaldos();
    }
  };

  const handleModalMovimentacao = (insumo: any) => {
    setInsumoSelecionado({ id: insumo.id, nome: insumo.nome });
    setModalMovimentacao(true);
  };

  const handleModalBaixa = (insumo: any) => {
    setInsumoSelecionado({ id: insumo.id, nome: insumo.nome });
    setModalBaixa(true);
  };

  const handleCloseModal = () => {
    setModalMovimentacao(false);
    setModalBaixa(false);
    setInsumoSelecionado(null);
    carregarSaldos();
  };

  const getStatusEstoque = (saldo: number, minimo?: number) => {
    if (saldo <= 0) return { variant: "destructive" as const, label: "Sem estoque" };
    if (minimo && saldo <= minimo) return { variant: "secondary" as const, label: "Abaixo do mínimo" };
    if (saldo <= 10) return { variant: "outline" as const, label: "Baixo" };
    return { variant: "default" as const, label: "Normal" };
  };

  const movimentacoesInsumoSelecionado = showHistorico 
    ? movimentacoes.filter(mov => mov.insumo_id === showHistorico)
    : [];

  if (loadingInsumos) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Carregando insumos...</div>
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
            placeholder="Buscar insumos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabela de insumos */}
      <Card>
        <CardHeader>
          <CardTitle>Controle de Estoque - Insumos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Insumo</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-center">Saldo Atual</TableHead>
                <TableHead className="text-center">Unidade</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {insumosFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    {searchTerm ? "Nenhum insumo encontrado" : "Nenhum insumo cadastrado"}
                  </TableCell>
                </TableRow>
              ) : (
                insumosFiltrados.map((insumo) => {
                  const saldo = saldos[insumo.id] || 0;
                  const status = getStatusEstoque(saldo, insumo.estoque_minimo);
                  
                  return (
                    <TableRow key={insumo.id}>
                      <TableCell>
                        <div className="font-medium">{insumo.nome}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{insumo.categoria}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-mono font-semibold">{saldo.toFixed(3)}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        {insumo.unidade_medida}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => entradaRapida(insumo.id, 1)}
                            title="Entrada rápida (+1)"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleModalBaixa(insumo)}
                            disabled={saldo <= 0}
                            title="Baixa de estoque"
                          >
                            <TrendingDown className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleModalMovimentacao(insumo)}
                            title="Nova movimentação"
                          >
                            Movimentar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowHistorico(showHistorico === insumo.id ? null : insumo.id)}
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

      {/* Histórico do insumo selecionado */}
      {showHistorico && (
        <HistoricoMovimentacoes
          itemId={showHistorico}
          itemNome={insumos.find(i => i.id === showHistorico)?.nome || "Insumo"}
          tipoItem="insumo"
          movimentacoes={movimentacoesInsumoSelecionado}
          loading={loadingMovimentacoes}
        />
      )}

      {/* Modais */}
      {insumoSelecionado && (
        <>
          <MovimentacaoEstoqueModal
            isOpen={modalMovimentacao}
            onClose={handleCloseModal}
            itemId={insumoSelecionado.id}
            itemNome={insumoSelecionado.nome}
            tipoItem="insumo"
            onSuccess={handleCloseModal}
          />
          
          <BaixaEstoqueModal
            isOpen={modalBaixa}
            onClose={handleCloseModal}
            itemId={insumoSelecionado.id}
            itemNome={insumoSelecionado.nome}
            tipoItem="insumo"
            saldoAtual={saldos[insumoSelecionado.id] || 0}
            onSuccess={handleCloseModal}
          />
        </>
      )}
    </div>
  );
}
