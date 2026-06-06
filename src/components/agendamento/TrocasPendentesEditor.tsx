import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trash2, Loader2, AlertTriangle } from "lucide-react";
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
  const { motivos, loading: loadingMotivos } = useMotivosTroca();
  const { produtos, loading: loadingProdutos } = useSupabaseProdutos();
  const [novaTroca, setNovaTroca] = useState<Partial<TrocaPendente>>({
    quantidade: 1
  });

  const produtosAtivos = produtos.filter(p => p.ativo);
  const valueRef = useRef(value);
  useEffect(() => { valueRef.current = value; }, [value]);

  // Auto-commit: assim que produto + motivo estiverem preenchidos, adiciona à lista
  useEffect(() => {
    if (
      novaTroca.produto_id &&
      novaTroca.produto_nome &&
      novaTroca.motivo_id &&
      novaTroca.motivo_nome &&
      (novaTroca.quantidade ?? 0) > 0
    ) {
      const trocaCompleta: TrocaPendente = {
        produto_id: novaTroca.produto_id,
        produto_nome: novaTroca.produto_nome,
        quantidade: novaTroca.quantidade!,
        motivo_id: novaTroca.motivo_id,
        motivo_nome: novaTroca.motivo_nome
      };
      onChange([...(valueRef.current || []), trocaCompleta]);
      setNovaTroca({ quantidade: 1 });
    }
  }, [novaTroca, onChange]);

  // Debug - logs para diagnóstico
  useEffect(() => {
    console.log('🔄 TrocasPendentesEditor - Produtos carregados:', produtos.length, 'Ativos:', produtosAtivos.length);
    console.log('🔄 TrocasPendentesEditor - Motivos carregados:', motivos.length);
    if (motivos.length > 0) {
      console.log('🔄 TrocasPendentesEditor - Motivos disponíveis:', motivos.map(m => `${m.id}: ${m.nome}`));
    }
  }, [produtos, produtosAtivos.length, motivos]);

  const handleRemoverTroca = (index: number) => {
    console.log('🗑️ Removendo troca no índice:', index);
    onChange(value.filter((_, i) => i !== index));
  };

  const handleProdutoChange = (produtoId: string) => {
    console.log('📦 Produto selecionado ID:', produtoId);
    const produto = produtos.find(p => p.id === produtoId);
    console.log('📦 Produto encontrado:', produto);
    
    if (produto) {
      setNovaTroca(prev => {
        const updated = {
          ...prev,
          produto_id: produto.id,
          produto_nome: produto.nome
        };
        console.log('📦 Estado novaTroca atualizado:', updated);
        return updated;
      });
    }
  };

  const handleMotivoChange = (motivoId: string) => {
    console.log('🏷️ Motivo selecionado ID:', motivoId);
    const motivo = motivos.find(m => m.id === Number(motivoId));
    console.log('🏷️ Motivo encontrado:', motivo);
    
    if (motivo) {
      setNovaTroca(prev => {
        const updated = {
          ...prev,
          motivo_id: motivo.id,
          motivo_nome: motivo.nome
        };
        console.log('🏷️ Estado novaTroca atualizado:', updated);
        return updated;
      });
    }
  };

  // Loading state
  if (loadingProdutos || loadingMotivos) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando opções...
      </div>
    );
  }

  // Verificar se há dados disponíveis
  if (produtosAtivos.length === 0 || motivos.length === 0) {
    return (
      <Alert className="bg-amber-50 border-amber-200">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          {produtosAtivos.length === 0 && "Nenhum produto ativo encontrado. "}
          {motivos.length === 0 && "Nenhum motivo de troca configurado."}
        </AlertDescription>
      </Alert>
    );
  }

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
            value={novaTroca.produto_id ?? undefined}
            onValueChange={handleProdutoChange}
          >
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Produto" />
            </SelectTrigger>
            <SelectContent>
              {produtosAtivos.map(produto => (
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
            value={novaTroca.quantidade || 1}
            onChange={(e) => setNovaTroca(prev => ({ ...prev, quantidade: Number(e.target.value) || 1 }))}
            placeholder="Qtd"
            className="h-9 text-center"
          />
        </div>
        
        <div className="flex-1">
          <Select
            value={novaTroca.motivo_id?.toString() ?? undefined}
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
      </div>
      <p className="text-xs text-muted-foreground">
        A troca é adicionada automaticamente assim que produto e motivo estão selecionados.
      </p>
    </div>
  );
}
