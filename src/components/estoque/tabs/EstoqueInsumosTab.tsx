
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, TrendingDown, BarChart3, Search, Settings, DollarSign, Package, AlertTriangle } from "lucide-react";
import { useSupabaseInsumos } from "@/hooks/useSupabaseInsumos";
import { useMovimentacoesEstoqueInsumos } from "@/hooks/useMovimentacoesEstoqueInsumos";
import { useConsumoSemanalInsumos } from "@/hooks/useConsumoSemanalInsumos";
import { useClientesIndustriais } from "@/hooks/useClientesIndustriais";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MovimentacaoEstoqueModal from "../MovimentacaoEstoqueModal";
import BaixaEstoqueModal from "../BaixaEstoqueModal";
import HistoricoMovimentacoes from "../HistoricoMovimentacoes";
import EditarInsumoModal from "../EditarInsumoModal";

const fmtMedida = (valor: number, unidade: string) => {
  if (unidade === 'g') return `${(valor / 1000).toFixed(3)} kg`;
  if (unidade === 'ml') return `${(valor / 1000).toFixed(3)} L`;
  return `${valor.toFixed(2)} ${unidade}`;
};

const fmtMoeda = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function EstoqueInsumosTab() {
  const { insumos, loading: loadingInsumos } = useSupabaseInsumos();
  const { movimentacoes, loading: loadingMovimentacoes, adicionarMovimentacao, obterSaldoInsumo } = useMovimentacoesEstoqueInsumos();
  const { consumoSemanal } = useConsumoSemanalInsumos();
  const { clientes: clientesIndustriais } = useClientesIndustriais();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroCliente, setFiltroCliente] = useState<string>("MISCHA");
  const [saldos, setSaldos] = useState<Record<string, number>>({});
  const [modalMovimentacao, setModalMovimentacao] = useState(false);
  const [modalBaixa, setModalBaixa] = useState(false);
  const [modalEditar, setModalEditar] = useState(false);
  const [insumoSelecionado, setInsumoSelecionado] = useState<{id: string, nome: string} | null>(null);
  const [insumoParaEditar, setInsumoParaEditar] = useState<any>(null);
  const [showHistorico, setShowHistorico] = useState<string | null>(null);

  const saldoInicialPorInsumo = useMemo(() => {
    return insumos.reduce<Record<string, number>>((acc, insumo) => {
      acc[insumo.id] = Number(insumo.estoque_atual ?? 0);
      return acc;
    }, {});
  }, [insumos]);

  const getSaldoInsumo = (insumo: { id: string; estoque_atual?: number | null }) =>
    saldos[insumo.id] ?? Number(insumo.estoque_atual ?? 0);

  // Carregar saldos dos insumos
  const carregarSaldos = async () => {
    const novosSaldos: Record<string, number> = { ...saldoInicialPorInsumo };
    for (const insumo of insumos) {
      const saldo = await obterSaldoInsumo(insumo.id);
      novosSaldos[insumo.id] = saldo || Number(insumo.estoque_atual ?? 0);
    }
    setSaldos(novosSaldos);
  };

  useEffect(() => {
    setSaldos(saldoInicialPorInsumo);
    if (insumos.length > 0) {
      carregarSaldos();
    }
  }, [insumos, saldoInicialPorInsumo]);

  // Filtrar insumos por cliente consignante e busca
  const insumosFiltrados = insumos.filter((insumo) => {
    const clienteMatch =
      filtroCliente === "TODOS"
        ? true
        : filtroCliente === "MISCHA"
          ? !insumo.cliente_id
          : insumo.cliente_id === filtroCliente;
    const nomeMatch = insumo.nome
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return clienteMatch && nomeMatch;
  });

  const nomeClientePorId = (id?: string | null) =>
    id ? clientesIndustriais.find((c) => c.id === id)?.nomeFantasia : null;

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

  const handleModalEditar = (insumo: any) => {
    setInsumoParaEditar(insumo);
    setModalEditar(true);
  };

  const handleCloseModal = () => {
    setModalMovimentacao(false);
    setModalBaixa(false);
    setInsumoSelecionado(null);
    carregarSaldos();
  };

  const handleCloseEditarModal = () => {
    setModalEditar(false);
    setInsumoParaEditar(null);
    carregarSaldos();
  };

  const getStatusEstoque = (saldo: number, consumoSem: number, minimo?: number) => {
    if (saldo <= 0) return { variant: "destructive" as const, label: "Sem estoque" };
    if (consumoSem > 0 && saldo < consumoSem * 0.2) {
      return { variant: "destructive" as const, label: "Estoque baixo" };
    }
    if (minimo && saldo <= minimo) return { variant: "secondary" as const, label: "Abaixo do mínimo" };
    return { variant: "default" as const, label: "Normal" };
  };

  // ==== Insights ====
  const valorTotalEstoque = insumos.reduce((acc, ins) => {
    const saldo = getSaldoInsumo(ins);
    const volumeBruto = Number(ins.volume_bruto) || 0;
    const custoMedioPack = Number(ins.custo_medio) || 0;
    const custoUnit = volumeBruto > 0 ? custoMedioPack / volumeBruto : 0;
    return acc + saldo * custoUnit;
  }, 0);

  const totalCadastrados = insumos.length;

  const itensEstoqueBaixo = insumos.filter(ins => {
    const saldo = getSaldoInsumo(ins);
    const consumoSem = consumoSemanal.get(ins.id) || 0;
    if (saldo <= 0) return true;
    return consumoSem > 0 && saldo < consumoSem * 0.2;
  }).length;

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
      {/* Cards de insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Valor total em estoque
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmtMoeda(valorTotalEstoque)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Insumos cadastrados
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCadastrados}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Estoque baixo
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{itensEstoqueBaixo}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Saldo &lt; 20% do consumo semanal
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e busca */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar insumos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filtroCliente} onValueChange={setFiltroCliente}>
          <SelectTrigger className="w-[240px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="MISCHA">Mischa's (estoque próprio)</SelectItem>
            {clientesIndustriais.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                Consignado — {c.nomeFantasia}
              </SelectItem>
            ))}
            <SelectItem value="TODOS">Todos</SelectItem>
          </SelectContent>
        </Select>
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
                <TableHead className="text-center">Consumo/sem</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {insumosFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">
                    {searchTerm ? "Nenhum insumo encontrado" : "Nenhum insumo cadastrado"}
                  </TableCell>
                </TableRow>
              ) : (
                insumosFiltrados.map((insumo) => {
                  const saldo = getSaldoInsumo(insumo);
                  const consumoSem = consumoSemanal.get(insumo.id) || 0;
                  const status = getStatusEstoque(saldo, consumoSem, insumo.estoque_minimo);
                  
                  return (
                    <TableRow key={insumo.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="font-medium">{insumo.nome}</div>
                          {insumo.cliente_id && (
                            <Badge
                              variant="outline"
                              className="bg-purple-50 text-purple-700 border-purple-200"
                            >
                              PL · {nomeClientePorId(insumo.cliente_id)}
                            </Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleModalEditar(insumo)}
                            className="h-6 w-6 p-0"
                            title="Editar insumo"
                          >
                            <Settings className="h-3 w-3" />
                          </Button>
                        </div>
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
                      <TableCell className="text-center font-mono text-sm">
                        {consumoSem > 0 ? fmtMedida(consumoSem, insumo.unidade_medida) : '—'}
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
            saldoAtual={
              saldos[insumoSelecionado.id] ??
              Number(insumos.find((i) => i.id === insumoSelecionado.id)?.estoque_atual ?? 0)
            }
            onSuccess={handleCloseModal}
          />
        </>
      )}

      {/* Modal de Editar Insumo */}
      {insumoParaEditar && (
        <EditarInsumoModal
          isOpen={modalEditar}
          onClose={handleCloseEditarModal}
          insumo={insumoParaEditar}
        />
      )}
    </div>
  );
}
