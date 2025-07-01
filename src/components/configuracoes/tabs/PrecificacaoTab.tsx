
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import { Tag, Edit3, Check, X } from "lucide-react";
import { useCategoriaStore } from "@/hooks/useCategoriaStore";
import { useConfiguracoesStore } from "@/hooks/useConfiguracoesStore";

// Schema for form validation
const precificacaoSchema = z.object({
  precosPorCategoria: z.record(z.number().min(0, "O preço deve ser maior ou igual a zero"))
});

export default function PrecificacaoTab() {
  const { categorias } = useCategoriaStore();
  const { obterConfiguracao, salvarConfiguracao, loading } = useConfiguracoesStore();
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>("");
  
  const precificacaoForm = useForm<z.infer<typeof precificacaoSchema>>({
    resolver: zodResolver(precificacaoSchema),
    defaultValues: {
      precosPorCategoria: {}
    },
  });

  // Carregar dados salvos quando o componente monta
  useEffect(() => {
    const configPrecificacao = obterConfiguracao('precificacao');
    if (configPrecificacao && Object.keys(configPrecificacao).length > 0) {
      precificacaoForm.reset(configPrecificacao);
    } else {
      // Inicializar com preços zerados para todas as categorias
      const precosPorCategoria: Record<string, number> = {};
      categorias.forEach(categoria => {
        precosPorCategoria[categoria.id.toString()] = 0;
      });
      precificacaoForm.reset({ precosPorCategoria });
    }
  }, [categorias, precificacaoForm, obterConfiguracao]);

  const handleEditStart = (categoriaId: string, currentValue: number) => {
    setEditingCategory(categoriaId);
    setTempValue(currentValue.toString());
  };

  const handleEditCancel = () => {
    setEditingCategory(null);
    setTempValue("");
  };

  const handleEditSave = async (categoriaId: string) => {
    const numericValue = Number(tempValue);
    
    if (isNaN(numericValue) || numericValue < 0) {
      toast({
        title: "Valor inválido",
        description: "Por favor, insira um valor numérico maior ou igual a zero",
        variant: "destructive"
      });
      return;
    }

    // Atualizar o valor no formulário
    const currentValues = precificacaoForm.getValues();
    const newValues = {
      ...currentValues,
      precosPorCategoria: {
        ...currentValues.precosPorCategoria,
        [categoriaId]: numericValue
      }
    };

    // Salvar no Supabase
    const sucesso = await salvarConfiguracao('precificacao', newValues);
    
    if (sucesso) {
      precificacaoForm.reset(newValues);
      setEditingCategory(null);
      setTempValue("");
      toast({
        title: "Preço atualizado",
        description: "O preço foi salvo com sucesso",
      });
    }
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const precosPorCategoria = precificacaoForm.watch("precosPorCategoria") || {};
  
  return (
    <Card>
      <CardHeader className="space-y-1">
        <div className="flex items-center space-x-2">
          <Tag className="h-4 w-4" />
          <CardTitle>Precificação por Categoria</CardTitle>
        </div>
        <CardDescription>
          Configure preços padrão para cada categoria de produto. Clique nos valores para editá-los.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Preços por Categoria</h3>
            
            {categorias.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhuma categoria de produto encontrada.</p>
                <p className="text-sm mt-1">
                  Cadastre categorias em "Configurações → Categorias" primeiro.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categorias.map((categoria) => {
                  const categoriaId = categoria.id.toString();
                  const currentValue = precosPorCategoria[categoriaId] || 0;
                  const isEditing = editingCategory === categoriaId;

                  return (
                    <div key={categoria.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{categoria.nome}</h4>
                        {!isEditing && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditStart(categoriaId, currentValue)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      
                      {categoria.descricao && (
                        <p className="text-sm text-muted-foreground">
                          {categoria.descricao}
                        </p>
                      )}

                      <div className="flex items-center space-x-2">
                        {isEditing ? (
                          <>
                            <Input
                              type="number"
                              min={0}
                              step="0.01"
                              value={tempValue}
                              onChange={(e) => setTempValue(e.target.value)}
                              className="flex-1"
                              placeholder="0.00"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleEditSave(categoriaId);
                                } else if (e.key === 'Escape') {
                                  handleEditCancel();
                                }
                              }}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditSave(categoriaId)}
                              className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                              disabled={loading}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleEditCancel}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <div
                            className="flex-1 p-2 bg-muted rounded cursor-pointer hover:bg-muted/80 transition-colors"
                            onClick={() => handleEditStart(categoriaId, currentValue)}
                          >
                            <span className="text-lg font-semibold">
                              {formatarMoeda(currentValue)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {categorias.length > 0 && (
            <div className="pt-4 border-t">
              <div className="flex justify-between items-center text-sm text-muted-foreground">
                <span>
                  {categorias.length} categoria{categorias.length !== 1 ? 's' : ''} configurada{categorias.length !== 1 ? 's' : ''}
                </span>
                <span>
                  Clique nos valores para editá-los • Enter para salvar • Esc para cancelar
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
