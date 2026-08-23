import { memo, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useClienteStore } from '@/hooks/useClienteStore';
import { useNavigate } from 'react-router-dom';
import { apenasOperacionais } from '@/utils/clienteTipo';
import DetalheIndicador, { type ConteudoDetalhe } from '@/components/mobile/DetalheIndicador';
import { useEhCelular } from '@/hooks/useEhCelular';

const STATUS_COLORS: Record<string, string> = {
  'Ativo': '#22c55e',
  'Inativo': '#ef4444',
  'Em análise': '#f59e0b',
  'Standby': '#6b7280',
  'A ativar': '#3b82f6',
  'Pipeline': '#8b5cf6'
};

const LoadingState = memo(() => (
  <Card className="flex h-full flex-col shadow-tema">
    <CardHeader>
      <Skeleton className="h-5 w-40" />
    </CardHeader>
    <CardContent className="flex-1">
      <Skeleton className="h-[200px] w-full" />
    </CardContent>
  </Card>
));

LoadingState.displayName = 'LoadingState';

export default function HomeStatusPieChart() {
  const navigate = useNavigate();
  const ehCelular = useEhCelular();
  const [detalhe, setDetalhe] = useState<ConteudoDetalhe | null>(null);
  const { clientes: clientesTodos, loading } = useClienteStore();
  const clientes = useMemo(() => apenasOperacionais(clientesTodos), [clientesTodos]);

  const dadosStatusPie = useMemo(() => {
    const statusCount: Record<string, number> = {};
    
    clientes.forEach(cliente => {
      const status = cliente.statusCliente || 'Sem status';
      statusCount[status] = (statusCount[status] || 0) + 1;
    });

    return Object.entries(statusCount)
      .map(([name, value]) => ({
        name,
        value,
        color: STATUS_COLORS[name] || '#9ca3af'
      }))
      .sort((a, b) => b.value - a.value);
  }, [clientes]);

  /**
   * A pizza responde "quantos"; a folha responde "quais". A ordem das linhas
   * segue a mesma da legenda — status mais numeroso primeiro, e dentro dele os
   * clientes em ordem alfabética, que é como se procura um nome.
   */
  const detalhe_ = useMemo<ConteudoDetalhe>(() => {
    const ordemStatus = dadosStatusPie.map(d => d.name);
    const linhas = [...clientes]
      .sort((a, b) => {
        const sa = a.statusCliente || 'Sem status';
        const sb = b.statusCliente || 'Sem status';
        const pa = ordemStatus.indexOf(sa);
        const pb = ordemStatus.indexOf(sb);
        return pa !== pb ? pa - pb : (a.nome || '').localeCompare(b.nome || '');
      })
      .map(c => ({
        id: c.id,
        titulo: c.nome,
        subtitulo: c.statusCliente || 'Sem status',
        alerta: c.statusCliente === 'Inativo'
      }));

    return {
      titulo: 'Distribuição por status',
      resumo: dadosStatusPie.map(d => `${d.value} ${d.name.toLowerCase()}`).join(' · '),
      linhas,
      vazio: 'Nenhum cliente cadastrado.',
      acao: {
        rotulo: 'Ver gestão comercial',
        aoClicar: () => navigate('/gestao-comercial?tab=representantes')
      }
    };
  }, [clientes, dadosStatusPie, navigate]);

  if (loading) return <LoadingState />;

  if (dadosStatusPie.length === 0) return null;

  return (
    <>
    <Card className="flex h-full flex-col shadow-tema cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary/50"
      onClick={() =>
        ehCelular ? setDetalhe(detalhe_) : navigate('/gestao-comercial?tab=representantes')
      }
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium text-left">
          Distribuição por Status
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={dadosStatusPie}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={70}
              paddingAngle={2}
              dataKey="value"
              animationDuration={0}
            >
              {dadosStatusPie.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number, name: string) => [`${value} clientes`, name]}
            />
            <Legend 
              iconSize={8}
              wrapperStyle={{ fontSize: '11px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>

    <DetalheIndicador conteudo={detalhe} aoFechar={() => setDetalhe(null)} />
    </>
  );
}
