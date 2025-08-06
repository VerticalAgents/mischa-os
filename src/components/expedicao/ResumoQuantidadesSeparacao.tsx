
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PedidoExpedicao {
  id: string;
  cliente_nome: string;
  quantidade_total: number;
  itens_personalizados?: any;
  tipo_pedido: string;
}

interface ResumoQuantidadesSeparacaoProps {
  pedidos: PedidoExpedicao[];
}

interface ResumoQuantidades {
  [key: string]: {
    quantidade: number;
    unidade: string;
  };
}

export function ResumoQuantidadesSeparacao({ pedidos }: ResumoQuantidadesSeparacaoProps) {
  const calcularResumo = (): ResumoQuantidades => {
    const resumo: ResumoQuantidades = {};
    
    pedidos.forEach(pedido => {
      if (pedido.tipo_pedido === 'Alterado' && pedido.itens_personalizados) {
        // Para pedidos personalizados, somar os itens específicos
        const itens = Array.isArray(pedido.itens_personalizados) 
          ? pedido.itens_personalizados 
          : [];
        
        itens.forEach((item: any) => {
          const nome = item.produto_nome || item.nome || 'Produto não identificado';
          const quantidade = item.quantidade || 0;
          const unidade = item.unidade || 'un';
          
          if (!resumo[nome]) {
            resumo[nome] = { quantidade: 0, unidade };
          }
          resumo[nome].quantidade += quantidade;
        });
      } else {
        // Para pedidos padrão, assumir que é o produto principal
        const nome = 'Produto Padrão';
        const quantidade = pedido.quantidade_total;
        const unidade = 'un';
        
        if (!resumo[nome]) {
          resumo[nome] = { quantidade: 0, unidade };
        }
        resumo[nome].quantidade += quantidade;
      }
    });
    
    return resumo;
  };

  const resumo = calcularResumo();
  const totalPedidos = pedidos.length;
  
  return (
    <Card className="mb-6 print:mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-foreground">
          Resumo para Separação - {totalPedidos} pedido{totalPedidos !== 1 ? 's' : ''}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(resumo).map(([produto, dados]) => (
            <div key={produto} className="flex justify-between items-center p-3 bg-muted rounded-lg">
              <span className="font-medium text-foreground">{produto}</span>
              <span className="font-bold text-lg text-primary">
                {dados.quantidade} {dados.unidade}
              </span>
            </div>
          ))}
        </div>
        
        {Object.keys(resumo).length === 0 && (
          <div className="text-center py-4 text-muted-foreground">
            Nenhum produto para separar
          </div>
        )}
      </CardContent>
    </Card>
  );
}
