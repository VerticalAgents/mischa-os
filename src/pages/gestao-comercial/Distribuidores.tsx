import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, Package, Store, TrendingUp, Check, X, Loader2 } from "lucide-react";
import { useDistribuidoresExpositores } from "@/hooks/useDistribuidoresExpositores";

export default function Distribuidores() {
  const { distribuidores, isLoading, metricas, updateExpositores, isUpdating } =
    useDistribuidoresExpositores();

  // Estado para edição inline
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);

  const handleStartEdit = (clienteId: string, currentValue: number) => {
    setEditingId(clienteId);
    setEditValue(currentValue);
  };

  const handleSaveEdit = (clienteId: string) => {
    updateExpositores({ clienteId, numeroExpositores: editValue });
    setEditingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValue(0);
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "Ativo":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-200";
      case "Inativo":
        return "bg-red-500/10 text-red-600 border-red-200";
      case "Standby":
        return "bg-amber-500/10 text-amber-600 border-amber-200";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Distribuidores Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metricas.distribuidoresAtivos}</div>
            <p className="text-xs text-muted-foreground">
              de {distribuidores.length} cadastrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Expositores</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metricas.totalExpositores}</div>
            <p className="text-xs text-muted-foreground">em uso pelos distribuidores</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">PDVs Estimados</CardTitle>
            <Store className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metricas.totalExpositores}</div>
            <p className="text-xs text-muted-foreground">1 expositor = 1 PDV</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Giro Semanal Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metricas.giroSemanalTotal}</div>
            <p className="text-xs text-muted-foreground">unidades/semana</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Distribuidores */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuidores</CardTitle>
        </CardHeader>
        <CardContent>
          {distribuidores.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Store className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum distribuidor cadastrado</p>
              <p className="text-sm">
                Cadastre clientes com a categoria "Distribuidor" para visualizá-los aqui
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Distribuidor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Expositores</TableHead>
                  <TableHead className="text-center">PDVs Est.</TableHead>
                  <TableHead className="text-center">Giro Médio</TableHead>
                  <TableHead className="text-center">Giro/Expositor</TableHead>
                  <TableHead>Contato</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {distribuidores.map((distribuidor) => {
                  const giroExpositor =
                    distribuidor.numero_expositores > 0
                      ? ((distribuidor.giro_medio_semanal ?? 0) /
                          distribuidor.numero_expositores).toFixed(1)
                      : "-";

                  return (
                    <TableRow key={distribuidor.cliente_id}>
                      <TableCell className="font-medium">{distribuidor.nome}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getStatusColor(distribuidor.status_cliente)}
                        >
                          {distribuidor.status_cliente ?? "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {editingId === distribuidor.cliente_id ? (
                          <div className="flex items-center justify-center gap-1">
                            <Input
                              type="number"
                              min={0}
                              value={editValue}
                              onChange={(e) => setEditValue(parseInt(e.target.value) || 0)}
                              className="w-16 h-8 text-center"
                              autoFocus
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => handleSaveEdit(distribuidor.cliente_id)}
                              disabled={isUpdating}
                            >
                              <Check className="h-4 w-4 text-emerald-600" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={handleCancelEdit}
                            >
                              <X className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            className="h-8 px-3 font-mono"
                            onClick={() =>
                              handleStartEdit(
                                distribuidor.cliente_id,
                                distribuidor.numero_expositores
                              )
                            }
                          >
                            {distribuidor.numero_expositores}
                          </Button>
                        )}
                      </TableCell>
                      <TableCell className="text-center font-mono">
                        {distribuidor.numero_expositores}
                      </TableCell>
                      <TableCell className="text-center font-mono">
                        {distribuidor.giro_medio_semanal ?? 0}
                      </TableCell>
                      <TableCell className="text-center font-mono">{giroExpositor}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {distribuidor.contato_nome && (
                            <div className="text-foreground">{distribuidor.contato_nome}</div>
                          )}
                          {distribuidor.contato_telefone && (
                            <div className="text-muted-foreground">
                              {distribuidor.contato_telefone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
