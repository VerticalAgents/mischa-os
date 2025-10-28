
import StatsTable from '@/components/dashboard/StatsTable';
import { Badge } from '@/components/ui/badge';
import GiroInlineEditor from './GiroInlineEditor';
import GiroOrigemBadge from './GiroOrigemBadge';

interface FaturamentoTableProps {
  precosDetalhados: any[];
  verificarSeGiroPersonalizado: (clienteId: string, categoriaId: number) => boolean;
  handleGiroAtualizado: () => void;
  isCategoriaRevenda: (categoriaNome: string) => boolean;
}

export default function FaturamentoTable({
  precosDetalhados,
  verificarSeGiroPersonalizado,
  handleGiroAtualizado,
  isCategoriaRevenda
}: FaturamentoTableProps) {
  const columns = [
    {
      header: 'Cliente',
      accessorKey: 'clienteNome' as keyof any,
      cell: (item: any) => <span className="font-medium">{item.clienteNome}</span>
    },
    {
      header: 'Categoria',
      accessorKey: 'categoriaNome' as keyof any,
      cell: (item: any) => (
        <Badge variant={isCategoriaRevenda(item.categoriaNome) ? "default" : "secondary"}>
          {item.categoriaNome}
        </Badge>
      )
    },
    {
      header: 'Giro Semanal',
      accessorKey: 'giroSemanal' as keyof any,
      cell: (item: any) => (
        <div className="space-y-1">
          <GiroInlineEditor
            clienteId={item.clienteId}
            categoriaId={item.categoriaId}
            giroAtual={item.giroSemanal}
            isPersonalizado={verificarSeGiroPersonalizado(item.clienteId, item.categoriaId)}
            onGiroAtualizado={handleGiroAtualizado}
          />
          <GiroOrigemBadge 
            origem={item.origemGiro} 
            numeroSemanas={item.numeroSemanasHistorico}
            compact
          />
        </div>
      )
    },
    {
      header: 'Preço Unit.',
      accessorKey: 'precoUnitario' as keyof any,
      cell: (item: any) => `R$ ${item.precoUnitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    },
    {
      header: 'Fat. Semanal',
      accessorKey: 'faturamentoSemanal' as keyof any,
      cell: (item: any) => `R$ ${item.faturamentoSemanal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    },
    {
      header: 'Fat. Mensal',
      accessorKey: 'faturamentoSemanal' as keyof any,
      cell: (item: any) => (
        <span className="font-semibold">
          R$ {(item.faturamentoSemanal * 4).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      header: 'Preço Personalizado',
      accessorKey: 'precoPersonalizado' as keyof any,
      cell: (item: any) => (
        item.precoPersonalizado ? (
          <Badge variant="outline" className="text-green-600">Sim</Badge>
        ) : (
          <Badge variant="outline">Não</Badge>
        )
      )
    }
  ];

  return (
    <StatsTable
      data={precosDetalhados}
      columns={columns}
      title="Faturamento por Cliente"
      description="Detalhamento do faturamento previsto por cliente e categoria"
    />
  );
}
