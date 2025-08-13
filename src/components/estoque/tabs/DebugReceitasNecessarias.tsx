
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSupabaseProdutos } from '@/hooks/useSupabaseProdutos';
import { useSupabaseReceitas } from '@/hooks/useSupabaseReceitas';
import { useRendimentosReceitaProduto } from '@/hooks/useRendimentosReceitaProduto';

interface DebugReceitasNecessariasProps {
  necessidadeProducao: Record<string, number>;
}

const DebugReceitasNecessarias: React.FC<DebugReceitasNecessariasProps> = ({ 
  necessidadeProducao 
}) => {
  const { produtos } = useSupabaseProdutos();
  const { receitas } = useSupabaseReceitas();
  const { obterRendimentoPorProduto } = useRendimentosReceitaProduto();

  const calcularReceitasNecessarias = () => {
    const receitasCalculadas: Array<{
      produto: string;
      quantidade: number;
      receita: string;
      rendimento: number;
      numeroReceitas: number;
      origem: 'rendimento_configurado' | 'receita_mesmo_nome' | 'ignorado';
    }> = [];

    Object.entries(necessidadeProducao).forEach(([nomeProduto, quantidade]) => {
      const produto = produtos.find(p => p.nome === nomeProduto && p.ativo);
      
      if (!produto) {
        receitasCalculadas.push({
          produto: nomeProduto,
          quantidade,
          receita: 'Não encontrado',
          rendimento: 0,
          numeroReceitas: 0,
          origem: 'ignorado'
        });
        return;
      }

      // Buscar rendimento real
      const rendimentoConfig = obterRendimentoPorProduto(produto.id);
      
      if (rendimentoConfig) {
        const receita = receitas.find(r => r.id === rendimentoConfig.receita_id);
        if (receita) {
          receitasCalculadas.push({
            produto: nomeProduto,
            quantidade,
            receita: receita.nome,
            rendimento: rendimentoConfig.rendimento,
            numeroReceitas: Math.ceil(quantidade / rendimentoConfig.rendimento),
            origem: 'rendimento_configurado'
          });
          return;
        }
      }

      // Fallback: receita com mesmo nome
      const receita = receitas.find(r => r.nome === nomeProduto);
      if (receita) {
        receitasCalculadas.push({
          produto: nomeProduto,
          quantidade,
          receita: receita.nome,
          rendimento: 40,
          numeroReceitas: Math.ceil(quantidade / 40),
          origem: 'receita_mesmo_nome'
        });
      } else {
        receitasCalculadas.push({
          produto: nomeProduto,
          quantidade,
          receita: 'Não encontrada',
          rendimento: 0,
          numeroReceitas: 0,
          origem: 'ignorado'
        });
      }
    });

    return receitasCalculadas;
  };

  const receitasCalculadas = calcularReceitasNecessarias();
  const totalReceitas = receitasCalculadas.reduce((sum, item) => sum + item.numeroReceitas, 0);

  const getOrigemBadge = (origem: string) => {
    switch (origem) {
      case 'rendimento_configurado':
        return <Badge variant="default" className="bg-green-500">Rendimento Real</Badge>;
      case 'receita_mesmo_nome':
        return <Badge variant="secondary">Fallback (40 un/receita)</Badge>;
      case 'ignorado':
        return <Badge variant="destructive">Ignorado</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-green-500 text-white text-xs flex items-center justify-center">3</span>
          Cálculo das Receitas Necessárias
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Usando rendimentos reais configurados na aba Rendimentos
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm font-medium">
          Receitas Necessárias ({totalReceitas} receitas total)
        </div>
        
        {receitasCalculadas.map((item, index) => (
          <div key={index} className="bg-gray-50 p-3 rounded-lg">
            <div className="font-medium text-sm">{item.receita}</div>
            <div className="text-xs text-gray-600 mt-1">
              {item.quantidade} unidades ÷ {item.rendimento} = {item.numeroReceitas} receitas ({item.produto})
            </div>
            <div className="mt-2">
              {getOrigemBadge(item.origem)}
            </div>
            {item.origem === 'rendimento_configurado' && (
              <div className="text-xs text-green-600 mt-1">
                ✓ Usando rendimento real: {item.rendimento} unidades/receita
              </div>
            )}
          </div>
        ))}
        
        {receitasCalculadas.length === 0 && (
          <div className="text-center text-gray-500 py-4">
            Nenhuma receita necessária para o período selecionado
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DebugReceitasNecessarias;
