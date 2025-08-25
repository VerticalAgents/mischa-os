
import { memo } from "react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Copy } from "lucide-react";
import { ReceitaCompleta } from "@/hooks/useOptimizedReceitasData";

interface ReceitaTableRowProps {
  receita: ReceitaCompleta;
  onEdit: (receita: ReceitaCompleta) => void;
  onRemove: (id: string) => void;
  onDuplicate: (receita: ReceitaCompleta) => void;
}

export const ReceitaTableRow = memo(function ReceitaTableRow({
  receita,
  onEdit,
  onRemove,
  onDuplicate
}: ReceitaTableRowProps) {
  const handleEdit = () => onEdit(receita);
  const handleRemove = () => {
    if (confirm("Tem certeza que deseja remover esta receita?")) {
      onRemove(receita.id);
    }
  };
  const handleDuplicate = () => onDuplicate(receita);

  return (
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
            onClick={handleDuplicate}
            title="Duplicar receita"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleEdit}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRemove}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
});
