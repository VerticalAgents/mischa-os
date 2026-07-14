import { useEffect, useMemo, useState } from "react";
import type { MouseEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useNiveisEmbalagemProduto } from "@/hooks/useNiveisEmbalagemProduto";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface EmbalagensTabProps {
  produtoId: string;
  produtoNome: string;
}

interface ProdutoOpcao {
  id: string;
  nome: string;
}

export default function EmbalagensTab({ produtoId, produtoNome }: EmbalagensTabProps) {
  const { niveis, loading, adicionar, remover, copiarDeProduto } = useNiveisEmbalagemProduto(produtoId);
  const { toast } = useToast();

  const [nome, setNome] = useState("");
  const [abreviacao, setAbreviacao] = useState("");
  const [unidadesPorNivel, setUnidadesPorNivel] = useState<number>(12);
  const [produtoOrigemId, setProdutoOrigemId] = useState("");
  const [produtosDisponiveis, setProdutosDisponiveis] = useState<ProdutoOpcao[]>([]);
  const [carregandoProdutos, setCarregandoProdutos] = useState(false);
  const [copiando, setCopiando] = useState(false);

  useEffect(() => {
    let cancelado = false;

    const carregarProdutos = async () => {
      setCarregandoProdutos(true);
      const { data, error } = await supabase
        .from("produtos_finais")
        .select("id, nome")
        .neq("id", produtoId)
        .order("nome", { ascending: true });

      if (cancelado) return;
      setCarregandoProdutos(false);

      if (error) {
        toast({
          title: "Erro ao carregar produtos",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setProdutosDisponiveis((data || []) as ProdutoOpcao[]);
    };

    carregarProdutos();
    setProdutoOrigemId("");

    return () => {
      cancelado = true;
    };
  }, [produtoId, toast]);

  const produtoOrigemNome = useMemo(
    () => produtosDisponiveis.find((produto) => produto.id === produtoOrigemId)?.nome,
    [produtoOrigemId, produtosDisponiveis]
  );

  const handleAdicionar = async (event?: MouseEvent<HTMLButtonElement>) => {
    event?.preventDefault();
    event?.stopPropagation();
    if (!nome.trim() || !abreviacao.trim() || unidadesPorNivel < 2) {
      toast({
        title: "Dados inválidos",
        description:
          "Preencha nome, abreviação e quantidade (mínimo 2 unidades por nível).",
        variant: "destructive",
      });
      return;
    }
    const proximaOrdem = niveis.length + 1;
    const ok = await adicionar({
      nome: nome.trim(),
      abreviacao: abreviacao.trim(),
      unidades_por_nivel: unidadesPorNivel,
      ordem: proximaOrdem,
    });
    if (ok) {
      setNome("");
      setAbreviacao("");
      setUnidadesPorNivel(12);
      toast({ title: "Nível adicionado" });
    }
  };

  const handleCopiar = async () => {
    if (!produtoOrigemId) {
      toast({
        title: "Selecione um produto",
        description: "Escolha de qual produto os níveis serão copiados.",
        variant: "destructive",
      });
      return;
    }

    setCopiando(true);
    const resultado = await copiarDeProduto(produtoOrigemId);
    setCopiando(false);

    if (resultado.ok && resultado.copiados > 0) {
      toast({
        title: "Níveis copiados",
        description: `${resultado.copiados} nível(is) copiado(s) de ${produtoOrigemNome || "outro produto"}.`,
      });
      setProdutoOrigemId("");
    }
  };

  return (
    <div className="space-y-4 mt-4 px-1">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sobre os níveis de embalagem</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1">
          <p>
            <strong>Unidade (Un.)</strong> sempre está disponível como nível
            base — não precisa ser configurada.
          </p>
          <p>
            Adicione níveis extras (Display, Caixa, etc.) com quantas unidades
            cabem em cada. Quando um produto tiver níveis configurados, será
            possível escolher entre eles ao lançar quantidades no agendamento
            (o total continua sendo convertido para unidades).
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Adicionar nível</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                placeholder="Ex.: Display"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Abreviação</Label>
              <Input
                placeholder="Ex.: Disp."
                value={abreviacao}
                onChange={(e) => setAbreviacao(e.target.value)}
                maxLength={8}
              />
            </div>
            <div className="space-y-2">
              <Label>Unidades por nível</Label>
              <Input
                type="number"
                min={2}
                step={1}
                value={unidadesPorNivel}
                onChange={(e) =>
                  setUnidadesPorNivel(parseInt(e.target.value) || 0)
                }
              />
            </div>
            <Button type="button" onClick={handleAdicionar} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Copiar de outro produto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-end">
            <div className="space-y-2">
              <Label>Produto de origem</Label>
              <Select
                value={produtoOrigemId}
                onValueChange={setProdutoOrigemId}
                disabled={carregandoProdutos || produtosDisponiveis.length === 0}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      carregandoProdutos
                        ? "Carregando produtos..."
                        : produtosDisponiveis.length === 0
                          ? "Nenhum outro produto disponível"
                          : "Selecione o produto"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {produtosDisponiveis.map((produto) => (
                    <SelectItem key={produto.id} value={produto.id}>
                      {produto.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleCopiar}
              disabled={!produtoOrigemId || copiando}
              className="w-full sm:w-auto"
            >
              <Copy className="h-4 w-4 mr-2" />
              {copiando ? "Copiando..." : "Copiar níveis"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Níveis configurados</CardTitle>
          <p className="text-sm text-muted-foreground">
            Estes níveis valem apenas para {produtoNome}. Outros produtos precisam ter seus próprios níveis ou copiar daqui.
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Abreviação</TableHead>
                <TableHead>Unidades</TableHead>
                <TableHead className="w-16">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="text-muted-foreground">
                <TableCell>Unidade</TableCell>
                <TableCell>Un.</TableCell>
                <TableCell>
                  <Badge variant="secondary">1</Badge>
                </TableCell>
                <TableCell>
                  <span className="text-xs italic">padrão</span>
                </TableCell>
              </TableRow>
              {loading && (
                <TableRow>
                  <TableCell colSpan={4} className="text-sm text-muted-foreground">
                    Carregando níveis configurados...
                  </TableCell>
                </TableRow>
              )}
              {!loading && niveis.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-sm text-muted-foreground">
                    Nenhum nível extra configurado ainda.
                  </TableCell>
                </TableRow>
              )}
              {!loading && niveis.map((n) => (
                <TableRow key={n.id}>
                  <TableCell>{n.nome}</TableCell>
                  <TableCell>{n.abreviacao}</TableCell>
                  <TableCell>
                    <Badge>{n.unidades_por_nivel} un</Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => remover(n.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
