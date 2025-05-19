import { useState } from "react";
import { useConfigStore } from "@/hooks/useConfigStore";
import { TipoLogistica } from "@/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Copy, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function TiposLogisticaList() {
  const { toast } = useToast();
  const tiposLogistica = useConfigStore((state) => state.tiposLogistica);
  const atualizarTipoLogistica = useConfigStore((state) => state.atualizarTipoLogistica);
  const removerTipoLogistica = useConfigStore((state) => state.removerTipoLogistica);
  const [novoItem, setNovoItem] = useState<Omit<TipoLogistica, "id">>({
    nome: `Novo Tipo ${tiposLogistica.length + 1}`,
    descricao: "",
    percentualLogistico: 0,
    ativo: true,
  });

  const handleAddNew = () => {
    useConfigStore.getState().adicionarTipoLogistica({
      nome: `Novo Tipo ${tiposLogistica.length + 1}`,
      descricao: "", // Add empty string for descricao
      percentualLogistico: 0,
      ativo: true
    });
    
    setNovoItem({
      nome: `Novo Tipo ${tiposLogistica.length + 1}`,
      descricao: "", // Add empty string for descricao
      percentualLogistico: 0,
      ativo: true
    });
    
    toast({
      title: "Tipo de logística adicionado",
      description: "Novo tipo de logística adicionado com sucesso.",
    });
  };

  const handleDuplicate = (item: TipoLogistica) => {
    useConfigStore.getState().adicionarTipoLogistica({
      nome: `${item.nome} (cópia)`,
      descricao: item.descricao || "", // Use existing descricao or empty string
      percentualLogistico: item.percentualLogistico,
      ativo: item.ativo
    });
    
    toast({
      title: "Tipo de logística duplicado",
      description: "Tipo de logística duplicado com sucesso.",
    });
  };

  const handleInputChange = (id: number, field: keyof TipoLogistica, value: any) => {
    const updatedTipoLogistica = tiposLogistica.map((tipoLogistica) =>
      tipoLogistica.id === id ? { ...tipoLogistica, [field]: value } : tipoLogistica
    );
    atualizarTipoLogistica(id, { ...updatedTipoLogistica.find(tipo => tipo.id === id) });
  };

  const handleDelete = (id: number) => {
    removerTipoLogistica(id);
    toast({
      title: "Tipo de logística removido",
      description: "Tipo de logística removido com sucesso.",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Tipos de Logística</h2>
        <Button onClick={handleAddNew}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Novo
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Percentual Logístico</TableHead>
            <TableHead>Ativo</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tiposLogistica.map((tipoLogistica) => (
            <TableRow key={tipoLogistica.id}>
              <TableCell>
                <Input
                  type="text"
                  value={tipoLogistica.nome}
                  onChange={(e) => handleInputChange(tipoLogistica.id, "nome", e.target.value)}
                />
              </TableCell>
              <TableCell>
                <Input
                  type="text"
                  value={tipoLogistica.descricao}
                  onChange={(e) => handleInputChange(tipoLogistica.id, "descricao", e.target.value)}
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  value={tipoLogistica.percentualLogistico}
                  onChange={(e) =>
                    handleInputChange(tipoLogistica.id, "percentualLogistico", Number(e.target.value))
                  }
                />
              </TableCell>
              <TableCell>
                <Input
                  type="checkbox"
                  checked={tipoLogistica.ativo}
                  onChange={(e) => handleInputChange(tipoLogistica.id, "ativo", e.target.checked)}
                />
              </TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" onClick={() => handleDuplicate(tipoLogistica)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicar
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(tipoLogistica.id)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
