import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { useMotivosTroca } from "@/hooks/useMotivosTroca";
import { useSupabaseProdutos } from "@/hooks/useSupabaseProdutos";

export interface TrocaPendente {
  produto_id?: string;
  produto_nome: string;
  quantidade: number;
  motivo_id?: number;
  motivo_nome: string;
}

interface TrocasPendentesEditorProps {
  value: TrocaPendente[];
  onChange: (trocas: TrocaPendente[]) => void;
}

export default function TrocasPendentesEditor({ value, onChange }: TrocasPendentesEditorProps) {
  const { motivos } = useMotivosTroca();
  const { produtos } = useSupabaseProdutos();
  const [novaTroca, setNovaTroca] = useState<Partial<TrocaPendente>>({
    quantidade: 1
  });

  const handleAdicionarTroca = () => {
    if (!novaTroca.produto_nome || !novaTroca.motivo_nome || !novaTroca.quantidade) return;
    
    onChange([...value, novaTroca as TrocaPendente]);
    setNovaTroca({ quantidade: 1 });
  };

  const handleRemoverTroca = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleProdutoChange = (produtoId: string) => {
    const produto = produtos.find(p => p.id === produtoId);
    if (produto) {
      setNovaTroca(prev => ({
        ...prev,
        produto_id: produto.id,
        produto_nome: produto.nome
      }));
    }
  };

  const handleMotivoChange = (motivoId: string) => {
    const motivo = motivos.find(m => m.id === Number(motivoId));
    if (motivo) {
      setNovaTroca(prev => ({
        ...prev,
        motivo_id: motivo.id,
        motivo_nome: motivo.nome
      }));
    }
  };

  return (
    <div className="space-y-3">
      {/* Lista de trocas existentes */}
      {value.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-2 font-medium">Produto</th>
                <th className="text-center p-2 font-medium w-16">Qtd</th>
                <th className="text-left p-2 font-medium">Motivo</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {value.map((troca, index) => (
                <tr key={index} className="border-t">
                  <td className="p-2">{troca.produto_nome}</td>
                  <td className="p-2 text-center">{troca.quantidade}</td>
                  <td className="p-2">{troca.motivo_nome}</td>
                  <td className="p-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => handleRemoverTroca(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Form para adicionar nova troca */}
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <Select
            value={novaTroca.produto_id || ""}
            onValueChange={handleProdutoChange}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Produto" />
            </SelectTrigger>
            <SelectContent>
              {produtos.filter(p => p.ativo).map(produto => (
                <SelectItem key={produto.id} value={produto.id}>
                  {produto.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="w-16">
          <Input
            type="number"
            min={1}
            value={novaTroca.quantidade || ""}
            onChange={(e) => setNovaTroca(prev => ({ ...prev, quantidade: Number(e.target.value) }))}
            placeholder="Qtd"
            className="h-9 text-center"
          />
        </div>
        
        <div className="flex-1">
          <Select
            value={novaTroca.motivo_id?.toString() || ""}
            onValueChange={handleMotivoChange}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Motivo" />
            </SelectTrigger>
            <SelectContent>
              {motivos.map(motivo => (
                <SelectItem key={motivo.id} value={motivo.id.toString()}>
                  {motivo.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9"
          onClick={handleAdicionarTroca}
          disabled={!novaTroca.produto_nome || !novaTroca.motivo_nome}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
