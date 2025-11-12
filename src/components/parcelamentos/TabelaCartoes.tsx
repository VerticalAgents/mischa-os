import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Power, CreditCard } from "lucide-react";
import { useCartoes } from "@/hooks/useCartoes";
import { CartaoFormDialog } from "./CartaoFormDialog";
import { useState } from "react";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function TabelaCartoes() {
  const { cartoes, isLoading, updateCartao } = useCartoes();
  const [editingCartao, setEditingCartao] = useState<any>(null);

  // Buscar utilização de cada cartão
  const { data: utilizacaoCartoes } = useQuery({
    queryKey: ['utilizacao-cartoes'],
    queryFn: async () => {
      const { data: parcelamentos } = await supabase
        .from('parcelamentos')
        .select('cartao_id, valor_total')
        .eq('status', 'ativo');

      const utilizacao: Record<string, number> = {};
      parcelamentos?.forEach(p => {
        utilizacao[p.cartao_id] = (utilizacao[p.cartao_id] || 0) + Number(p.valor_total);
      });

      return utilizacao;
    },
  });

  const handleToggleAtivo = (cartao: any) => {
    updateCartao({ id: cartao.id, ativo: !cartao.ativo });
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Carregando...</div>;
  }

  if (cartoes.length === 0) {
    return (
      <div className="text-center py-12">
        <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-2">Nenhum cartão cadastrado</p>
        <p className="text-sm text-muted-foreground">
          Adicione um cartão de crédito para começar a gerenciar seus parcelamentos
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Bandeira</TableHead>
              <TableHead>Final</TableHead>
              <TableHead className="text-center">Vencimento</TableHead>
              <TableHead className="text-center">Fechamento</TableHead>
              <TableHead>Limite</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cartoes.map((cartao) => {
              const utilizado = utilizacaoCartoes?.[cartao.id] || 0;
              const percentual = cartao.limite_credito > 0 
                ? (utilizado / cartao.limite_credito) * 100 
                : 0;

              return (
                <TableRow key={cartao.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: cartao.cor_identificacao }}
                      />
                      {cartao.nome}
                    </div>
                  </TableCell>
                  <TableCell>{cartao.bandeira}</TableCell>
                  <TableCell className="font-mono">••••{cartao.ultimos_digitos}</TableCell>
                  <TableCell className="text-center">{cartao.dia_vencimento}</TableCell>
                  <TableCell className="text-center">{cartao.dia_fechamento}</TableCell>
                  <TableCell>
                    <div className="space-y-1 min-w-[150px]">
                      <div className="flex justify-between text-xs">
                        <span>R$ {utilizado.toFixed(2)}</span>
                        <span className="text-muted-foreground">
                          R$ {cartao.limite_credito.toFixed(2)}
                        </span>
                      </div>
                      <Progress 
                        value={percentual} 
                        className="h-2"
                      />
                      <p className="text-xs text-muted-foreground">
                        {percentual.toFixed(1)}% utilizado
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={cartao.ativo ? "default" : "secondary"}>
                      {cartao.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingCartao(cartao)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleAtivo(cartao)}>
                          <Power className="h-4 w-4 mr-2" />
                          {cartao.ativo ? "Desativar" : "Ativar"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {editingCartao && (
        <CartaoFormDialog
          cartao={editingCartao}
          trigger={<div />}
        />
      )}
    </>
  );
}
