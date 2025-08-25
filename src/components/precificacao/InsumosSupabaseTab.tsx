
import { useState } from "react";
import { useSupabaseInsumos } from "@/hooks/useSupabaseInsumos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export default function InsumosSupabaseTab() {
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
  const [editandoInsumo, setEditandoInsumo] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
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

  // Filtrar insumos
  const insumosFiltrados = searchTerm
    ? insumos.filter(insumo =>
        insumo.nome.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : insumos;

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
              <Button onClick={() => console.log('Novo insumo')}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Insumo
              </Button>
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

            {/* Filtro */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Filtrar insumos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Tabela de Insumos */}
            <div className="w-full overflow-x-auto">
              <div className="rounded-md border min-w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[150px]">Nome</TableHead>
                      <TableHead className="min-w-[100px]">Categoria</TableHead>
                      <TableHead className="min-w-[120px]">Volume Bruto</TableHead>
                      <TableHead className="min-w-[120px]">Custo Médio (R$)</TableHead>
                      <TableHead className="min-w-[120px]">Custo/g (R$)</TableHead>
                      <TableHead className="min-w-[80px]">Estoque</TableHead>
                      <TableHead className="text-right min-w-[120px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="flex items-center justify-center gap-2">
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            Carregando insumos...
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : insumosFiltrados.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          {searchTerm ? `Nenhum insumo encontrado para "${searchTerm}"` : "Nenhum insumo cadastrado"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      insumosFiltrados.map((insumo) => (
                        <TableRow key={insumo.id}>
                          <TableCell className="font-medium">{insumo.nome}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{insumo.categoria}</Badge>
                          </TableCell>
                          <TableCell>{insumo.volume_bruto}{insumo.unidade_medida}</TableCell>
                          <TableCell>R$ {(insumo.custo_medio || 0).toFixed(2)}</TableCell>
                          <TableCell>
                            R$ {calcularCustoUnitario(insumo).toFixed(4)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={(insumo.estoque_atual || 0) > 0 ? "default" : "secondary"}>
                              {insumo.estoque_atual || 0}
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
    </div>
  );
}
