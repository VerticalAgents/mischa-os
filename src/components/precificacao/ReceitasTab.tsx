import { useState, useEffect } from "react";
import { useSupabaseReceitas, ReceitaCompleta } from "@/hooks/useSupabaseReceitas";
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
import { Edit, Trash2 } from "lucide-react";
import EditarReceitaModal from "./EditarReceitaModal";

export default function ReceitasTab() {
  const { receitas, loading, carregarReceitas, removerReceita } = useSupabaseReceitas();
  const [editandoReceita, setEditandoReceita] = useState<ReceitaCompleta | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleRemoverReceita = async (id: string) => {
    const success = await removerReceita(id);
    if (success) {
      carregarReceitas();
    }
  };

  const abrirEdicaoReceita = (receita: ReceitaCompleta) => {
    setEditandoReceita(receita);
    setIsEditModalOpen(true);
  };

  const fecharEdicaoReceita = () => {
    setEditandoReceita(null);
    setIsEditModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Lista de receitas */}
      <Card>
        <CardHeader>
          <CardTitle>Receitas Base Cadastradas</CardTitle>
          <CardDescription>
            Lista de todas as receitas base do sistema
          </CardDescription>
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
                receitas.map((receita) => (
                  <TableRow key={receita.id}>
                    <TableCell className="font-medium">{receita.nome}</TableCell>
                    <TableCell>
                      {receita.rendimento} {receita.unidade_rendimento}
                    </TableCell>
                    <TableCell>{receita.peso_total.toFixed(2)}g</TableCell>
                    <TableCell className="text-right">
                      R$ {receita.custo_total.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      R$ {receita.custo_unitario.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
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
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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
