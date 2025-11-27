
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DollarSign, Edit3, Check, X, RotateCcw, RefreshCw } from "lucide-react";
import { Cliente } from "@/types";
import { useSupabaseCategoriasProduto } from "@/hooks/useSupabaseCategoriasProduto";
import { usePrecificacaoClienteStore } from "@/hooks/usePrecificacaoClienteStore";

interface PrecificacaoPorCategoriaProps {
  cliente: Cliente;
}

export default function PrecificacaoPorCategoria({ cliente }: PrecificacaoPorCategoriaProps) {
  const { categorias, loading: loadingCategorias, carregarCategorias } = useSupabaseCategoriasProduto();
  const {
    precosCliente,
    loading,
    carregarPrecosCliente,
    salvarPrecosCliente,
    atualizarPrecoCategoria,
    resetarPrecoParaPadrao
  } = usePrecificacaoClienteStore();
  
  const [editingCategory, setEditingCategory] = useState<number | null>(null);
  const [tempValue, setTempValue] = useState<string>("");
  const [precosCarregados, setPrecosCarregados] = useState(false);

  // Carregar categorias ao montar
  useEffect(() => {
    carregarCategorias();
  }, []);

  const handleCarregarPrecos = async () => {
    if (cliente?.id && cliente?.categoriasHabilitadas?.length) {
      console.log('🔄 PrecificacaoPorCategoria: Carregando preços para cliente:', {
        clienteId: cliente.id,
        categoriasHabilitadas: cliente.categoriasHabilitadas
      });
      await carregarPrecosCliente(cliente.id, cliente.categoriasHabilitadas);
      setPrecosCarregados(true);
    }
  };

  const handleEditStart = (categoriaId: number, currentValue: number) => {
    setEditingCategory(categoriaId);
    setTempValue(currentValue.toString());
  };

  const handleEditCancel = () => {
    setEditingCategory(null);
    setTempValue("");
  };

  const handleEditSave = async (categoriaId: number) => {
    const numericValue = Number(tempValue);
    
    if (isNaN(numericValue) || numericValue < 0) {
      return;
    }

    // Atualizar localmente
    atualizarPrecoCategoria(categoriaId, numericValue, true);

    // Salvar no banco
    await salvarPrecosCliente(cliente.id, precosCliente.map(p => 
      p.categoriaId === categoriaId 
        ? { ...p, preco: numericValue, precoPersonalizado: true }
        : p
    ));

    setEditingCategory(null);
    setTempValue("");
  };

  const handleResetToPadrao = async (categoriaId: number) => {
    resetarPrecoParaPadrao(categoriaId);
    
    // Salvar no banco (remove o preço personalizado)
    await salvarPrecosCliente(cliente.id, precosCliente.filter(p => 
      p.categoriaId !== categoriaId || !p.precoPersonalizado
    ));
  };

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  const categoriasHabilitadas = cliente?.categoriasHabilitadas || [];
  const categoriasComPreco = precosCliente.filter(p => 
    categoriasHabilitadas.includes(p.categoriaId)
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Precificação por Categoria
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loadingCategorias ? (
          <div className="text-center py-8 text-muted-foreground">
            Carregando categorias...
          </div>
        ) : categoriasHabilitadas.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenhuma categoria habilitada para este cliente.</p>
            <p className="text-sm mt-1">
              Configure as categorias na seção "Categorias de Produtos" primeiro.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Botão para carregar preços */}
            <div className="flex justify-center">
              <Button
                onClick={handleCarregarPrecos}
                disabled={loading}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Carregando...' : precosCarregados ? 'Recarregar Preços' : 'Carregar Preços'}
              </Button>
            </div>

            {loading && (
              <div className="text-center text-muted-foreground">
                Carregando preços...
              </div>
            )}

            {!loading && precosCarregados && categoriasComPreco.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                <p>Nenhum preço configurado para as categorias habilitadas.</p>
                <p className="text-sm mt-1">
                  Configure os preços em Configurações &gt; Precificação primeiro.
                </p>
              </div>
            )}

            {!loading && categoriasComPreco.length > 0 && (
              <>
                {categoriasComPreco.map((precoCategoria) => {
                  const categoria = categorias.find(c => c.id === precoCategoria.categoriaId);
                  const isEditing = editingCategory === precoCategoria.categoriaId;
                  
                  if (!categoria) return null;

                  return (
                    <div key={categoria.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{categoria.nome}</h4>
                          {precoCategoria.precoPersonalizado && (
                            <Badge variant="secondary" className="text-xs">
                              Personalizado
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {!isEditing && (
                            <>
                              {precoCategoria.precoPersonalizado && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleResetToPadrao(precoCategoria.categoriaId)}
                                  className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700"
                                  title="Resetar para preço padrão"
                                >
                                  <RotateCcw className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditStart(precoCategoria.categoriaId, precoCategoria.preco)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit3 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
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
                                  handleEditSave(precoCategoria.categoriaId);
                                } else if (e.key === 'Escape') {
                                  handleEditCancel();
                                }
                              }}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditSave(precoCategoria.categoriaId)}
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
                            onClick={() => handleEditStart(precoCategoria.categoriaId, precoCategoria.preco)}
                          >
                            <span className="text-lg font-semibold">
                              {formatarMoeda(precoCategoria.preco)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                <Separator />
                
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>
                    {categoriasComPreco.length} categoria{categoriasComPreco.length !== 1 ? 's' : ''} configurada{categoriasComPreco.length !== 1 ? 's' : ''}
                  </span>
                  <span>
                    Clique nos preços para editá-los • Enter para salvar • Esc para cancelar
                  </span>
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
