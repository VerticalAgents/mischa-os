import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ProdutoNomeDisplayProps {
  produtoId: string;
  nomeFallback?: string;
  className?: string;
}

export default function ProdutoNomeDisplay({ produtoId, nomeFallback, className }: ProdutoNomeDisplayProps) {
  const [nomeProduto, setNomeProduto] = useState<string>(nomeFallback || `Produto ${produtoId}`);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregarNomeProduto = async () => {
      try {
        // Verificar se é um produto customizado
        if (produtoId.startsWith('custom-')) {
          setNomeProduto(nomeFallback || 'Produto Personalizado');
          setLoading(false);
          return;
        }

        // Buscar primeiro em produtos_finais
        const { data: produtoFinal } = await supabase
          .from('produtos_finais')
          .select('nome')
          .eq('id', produtoId)
          .single();

        if (produtoFinal) {
          setNomeProduto(produtoFinal.nome);
          setLoading(false);
          return;
        }

        // Se não encontrou, buscar em produtos (legacy)
        const { data: produto } = await supabase
          .from('produtos')
          .select('nome')
          .eq('id', produtoId)
          .single();

        if (produto) {
          setNomeProduto(produto.nome);
        } else {
          setNomeProduto(nomeFallback || `Produto ${produtoId.substring(0, 8)}`);
        }
      } catch (error) {
        console.error('Erro ao carregar nome do produto:', error);
        setNomeProduto(nomeFallback || `Produto ${produtoId.substring(0, 8)}`);
      } finally {
        setLoading(false);
      }
    };

    carregarNomeProduto();
  }, [produtoId, nomeFallback]);

  if (loading) {
    return <span className={`text-muted-foreground ${className || ''}`}>Carregando...</span>;
  }

  return <span className={className}>{nomeProduto}</span>;
}
