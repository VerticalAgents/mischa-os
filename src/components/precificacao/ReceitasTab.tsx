
import { useState, useEffect } from "react";
import { useSupabaseReceitas, ReceitaCompleta } from "@/hooks/useSupabaseReceitas";
import { useSupabaseInsumos } from "@/hooks/useSupabaseInsumos";
import { Button } from "@/components/ui/button";
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
import { Edit, Trash2, Copy, Plus } from "lucide-react";
import EditarReceitaModal from "./EditarReceitaModal";
import CriarReceitaModal from "./CriarReceitaModal";

export default function ReceitasTab() {
  const { receitas, loading, carregarReceitas, removerReceita, duplicarReceita } = useSupabaseReceitas();
  const { insumos } = useSupabaseInsumos();
  const [editandoReceita, setEditandoReceita] = useState<ReceitaCompleta | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleRemoverReceita = async (id: string) => {
    if (confirm("Tem certeza que deseja remover esta receita?")) {
      const success = await removerReceita(id);
      if (success) {
        carregarReceitas();
      }
    }
  };

  const handleDuplicarReceita = async (receita: ReceitaCompleta) => {
    await duplicarReceita(receita);
  };

  const abrirEdicaoReceita = (receita: ReceitaCompleta) => {
    setEditandoReceita(receita);
    setIsEditModalOpen(true);
  };

  const fecharEdicaoReceita = () => {
    setEditandoReceita(null);
    setIsEditModalOpen(false);
  };

  const abrirCriacaoReceita = () => {
    setIsCreateModalOpen(true);
  };

  const fecharCriacaoReceita = () => {
    setIsCreateModalOpen(false);
  };

  // Função para calcular o custo unitário correto de um insumo
  const calcularCustoUnitarioInsumo = (insumoId: string) => {
    const insumo = insumos.find(i => i.id === insumoId);
    if (!insumo) return 0;
    return insumo.volume_bruto > 0 ? insumo.custo_medio / insumo.volume_bruto : 0;
  };

  // Função para calcular o custo total correto de uma receita
  const calcularCustoTotalReceita = (receita: ReceitaCompleta) => {
    return receita.itens.reduce((total, item) => {
      const custoUnitario = calcularCustoUnitarioInsumo(item.insumo_id);
      return total + (custoUnitario * item.quantidade);
    }, 0);
  };

  // Função para calcular o custo unitário da receita
  const calcularCustoUnitarioReceita = (receita: ReceitaCompleta) => {
    const custoTotal = calcularCustoTotalReceita(receita);
    return receita.rendimento > 0 ? custoTotal / receita.rendimento : 0;
  };

  // Função para calcular o peso total da receita
  const calcularPesoTotalReceita = (receita: ReceitaCompleta) => {
    return receita.itens.reduce((total, item) => total + item.quantidade, 0);
  };

  return (
    <div className="space-y-6">
      {/* Lista de receitas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Receitas Base Cadastradas</CardTitle>
              <CardDescription>
                Lista de todas as receitas base do sistema
              </CardDescription>
            </div>
            <Button onClick={abrirCriacaoReceita}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Receita
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Rendimento</TableHead>
                <TableHead>Peso Total (g)</TableHead>
                <TableHead className="text-right">Custo Total (R$)</TableHead>
                <TableHead className="text-right">Custo Unitário (R$)</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Carregando receitas...
                  </TableCell>
                </TableRow>
              ) : receitas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Nenhuma receita cadastrada
                  </TableCell>
                </TableRow>
              ) : (
                receitas.map((receita) => {
                  const custoTotal = calcularCustoTotalReceita(receita);
                  const custoUnitario = calcularCustoUnitarioReceita(receita);
                  const pesoTotal = calcularPesoTotalReceita(receita);
                  
                  return (
                    <TableRow key={receita.id}>
                      <TableCell className="font-medium">{receita.nome}</TableCell>
                      <TableCell>
                        {receita.rendimento} {receita.unidade_rendimento}
                      </TableCell>
                      <TableCell>{pesoTotal.toFixed(2)}g</TableCell>
                      <TableCell className="text-right">
                        R$ {custoTotal.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        R$ {custoUnitario.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDuplicarReceita(receita)}
                            title="Duplicar receita"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => abrirEdicaoReceita(receita)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRemoverReceita(receita.id)}
                          >
                            <Trash2 className="h-4 w-4" />
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

      {/* Modal de Criação */}
      <CriarReceitaModal
        isOpen={isCreateModalOpen}
        onClose={fecharCriacaoReceita}
        onSuccess={carregarReceitas}
      />

      {/* Modal de Edição */}
      <EditarReceitaModal
        receita={editandoReceita}
        isOpen={isEditModalOpen}
        onClose={fecharEdicaoReceita}
        onSuccess={carregarReceitas}
      />
    </div>
  );
}
