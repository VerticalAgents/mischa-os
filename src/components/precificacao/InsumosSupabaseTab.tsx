
import { useState } from "react";
import { useEditPermission } from "@/contexts/EditPermissionContext";
import { useSupabaseInsumos } from "@/hooks/useSupabaseInsumos";
import { useClientesIndustriais } from "@/hooks/useClientesIndustriais";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, RefreshCw, Search, Edit, Trash2 } from "lucide-react";
import EditarInsumoModal from "@/components/estoque/EditarInsumoModal";
import AdicionarInsumoModal from "@/components/precificacao/AdicionarInsumoModal";

export default function InsumosSupabaseTab() {
  const { canEdit } = useEditPermission();
  const { 
    insumos, 
    loading, 
    carregarInsumos,
    adicionarInsumo,
    atualizarInsumo,
    removerInsumo,
    calcularCustoUnitario 
  } = useSupabaseInsumos();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [ownerFilter, setOwnerFilter] = useState<string>('all');
  const { clientes: clientesIndustriais } = useClientesIndustriais();
  const [editandoInsumo, setEditandoInsumo] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await carregarInsumos();
    setRefreshing(false);
  };

  const handleEditarInsumo = (insumo: any) => {
    setEditandoInsumo(insumo);
    setIsEditModalOpen(true);
  };

  const handleRemoverInsumo = async (insumoId: string) => {
    if (confirm('Tem certeza que deseja remover este insumo?')) {
      await removerInsumo(insumoId);
    }
  };

  const fecharEdicaoInsumo = () => {
    setEditandoInsumo(null);
    setIsEditModalOpen(false);
  };

  const handleNovoInsumo = () => {
    setIsAddModalOpen(true);
  };

  const fecharAdicaoInsumo = () => {
    setIsAddModalOpen(false);
  };

  // Filtrar e ordenar insumos: proprietário (Mischa's antes dos PLs) e depois alfabético
  const insumosFiltrados = insumos
    .filter((insumo) => {
      const matchesSearch = searchTerm
        ? insumo.nome.toLowerCase().includes(searchTerm.toLowerCase())
        : true;
      const matchesOwner =
        ownerFilter === 'all'
          ? true
          : ownerFilter === 'mischas'
            ? !insumo.cliente_id
            : insumo.cliente_id === ownerFilter;
      return matchesSearch && matchesOwner;
    })
  const nomeClienteById = (id?: string | null) =>
    id ? clientesIndustriais.find((c) => c.id === id)?.nomeFantasia : undefined;

    .sort((a, b) => {
      // Mischa's (sem cliente_id) vem primeiro; depois clientes PL por nome do proprietário
      const aIsMischas = !a.cliente_id;
      const bIsMischas = !b.cliente_id;
      if (aIsMischas && !bIsMischas) return -1;
      if (!aIsMischas && bIsMischas) return 1;

      // Ambos PL: ordenar pelo nome do proprietário
      const aOwner = nomeClienteById(a.cliente_id) || '';
      const bOwner = nomeClienteById(b.cliente_id) || '';
      if (aOwner !== bOwner) return aOwner.localeCompare(bOwner, 'pt-BR');

      // Mesmo proprietário: ordenar alfabeticamente pelo nome do insumo
      return a.nome.localeCompare(b.nome, 'pt-BR');
    });

  // Calcular métricas
  const metricas = {
    totalInsumos: insumos.length,
    insumosComEstoque: insumos.filter(i => (i.estoque_atual || 0) > 0).length,
    custoMedio: insumos.length > 0 
      ? insumos.reduce((sum, i) => sum + (i.custo_medio || 0), 0) / insumos.length 
      : 0,
    volumeMedio: insumos.length > 0 
      ? insumos.reduce((sum, i) => sum + (i.volume_bruto || 0), 0) / insumos.length 
      : 0
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <CardTitle>Insumos</CardTitle>
                <CardDescription>Gestão completa de insumos e custos</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              {canEdit && (
                <Button onClick={handleNovoInsumo}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Insumo
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Métricas rápidas */}
            {!loading && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">{metricas.totalInsumos}</div>
                    <p className="text-xs text-muted-foreground">Total de Insumos</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-green-600">{metricas.insumosComEstoque}</div>
                    <p className="text-xs text-muted-foreground">Com Estoque</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-blue-600">
                      R$ {metricas.custoMedio.toFixed(2)}
                    </div>
                    <p className="text-xs text-muted-foreground">Custo Médio</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-purple-600">
                      {metricas.volumeMedio.toFixed(0)}g
                    </div>
                    <p className="text-xs text-muted-foreground">Volume Médio</p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Filtros */}
            <div className="flex flex-col md:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Filtrar insumos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={ownerFilter} onValueChange={setOwnerFilter}>
                <SelectTrigger className="w-full md:w-[240px]">
                  <SelectValue placeholder="Proprietário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os proprietários</SelectItem>
                  <SelectItem value="mischas">Mischa's (próprio)</SelectItem>
                  {clientesIndustriais.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nomeFantasia}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tabela de Insumos */}
            <div className="w-full">
              <div className="rounded-md border w-full">
                <Table className="w-full table-auto">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead className="whitespace-nowrap">Categoria</TableHead>
                      <TableHead className="whitespace-nowrap">Proprietário</TableHead>
                      <TableHead className="whitespace-nowrap">Volume Bruto</TableHead>
                      <TableHead className="whitespace-nowrap">Custo Médio (R$)</TableHead>
                      <TableHead className="whitespace-nowrap">Custo/g (R$)</TableHead>
                      <TableHead className="whitespace-nowrap">Estoque</TableHead>
                      <TableHead className="text-right whitespace-nowrap">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <div className="flex items-center justify-center gap-2">
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            Carregando insumos...
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : insumosFiltrados.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          {searchTerm ? `Nenhum insumo encontrado para "${searchTerm}"` : "Nenhum insumo cadastrado"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      insumosFiltrados.map((insumo) => (
                        <TableRow key={insumo.id}>
                          <TableCell className="font-medium">{insumo.nome}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="whitespace-nowrap">{insumo.categoria}</Badge>
                          </TableCell>
                          <TableCell>
                            {insumo.cliente_id ? (
                              <Badge className="whitespace-nowrap bg-purple-100 text-purple-800 hover:bg-purple-100 border-purple-200">
                                {nomeClienteById(insumo.cliente_id) ?? 'Cliente PL'}
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="whitespace-nowrap">Mischa's</Badge>
                            )}
                          </TableCell>
                          <TableCell>{insumo.volume_bruto}{insumo.unidade_medida}</TableCell>
                          <TableCell>R$ {(insumo.custo_medio || 0).toFixed(2)}</TableCell>
                          <TableCell>
                            R$ {calcularCustoUnitario(insumo).toFixed(4)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={(insumo.estoque_atual || 0) > 0 ? "default" : "secondary"} className="whitespace-nowrap">
                              {Number(insumo.estoque_atual || 0).toFixed(2)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditarInsumo(insumo)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRemoverInsumo(insumo.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Edição */}
      <EditarInsumoModal
        insumo={editandoInsumo}
        isOpen={isEditModalOpen}
        onClose={fecharEdicaoInsumo}
      />

      {/* Modal de Adição */}
      <AdicionarInsumoModal
        isOpen={isAddModalOpen}
        onClose={fecharAdicaoInsumo}
      />
    </div>
  );
}
