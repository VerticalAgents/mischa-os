
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, TrendingUp, Users } from 'lucide-react';
import { ResumoCategoria } from '@/hooks/useCurvaABC';

interface CurvaABCCardsProps {
  resumoCategorias: ResumoCategoria[];
  isLoading: boolean;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

const categoriaConfig = {
  A: {
    icon: Crown,
    borderColor: 'border-l-green-500',
    iconColor: 'text-green-600',
    titleColor: 'text-green-700',
    badgeBg: 'bg-green-100 text-green-800',
    metaLabel: '80% da Receita'
  },
  B: {
    icon: TrendingUp,
    borderColor: 'border-l-yellow-500',
    iconColor: 'text-yellow-600',
    titleColor: 'text-yellow-700',
    badgeBg: 'bg-yellow-100 text-yellow-800',
    metaLabel: '15% da Receita'
  },
  C: {
    icon: Users,
    borderColor: 'border-l-gray-400',
    iconColor: 'text-gray-500',
    titleColor: 'text-gray-600',
    badgeBg: 'bg-gray-100 text-gray-700',
    metaLabel: '5% da Receita'
  }
};

export function CurvaABCCards({ resumoCategorias, isLoading }: CurvaABCCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="border-l-4 border-l-muted">
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-5 bg-muted rounded w-32" />
                <div className="h-10 bg-muted rounded w-24" />
                <div className="h-6 bg-muted rounded w-40" />
                <div className="h-6 bg-muted rounded w-48" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {resumoCategorias.map(resumo => {
        const config = categoriaConfig[resumo.categoria];
        const Icon = config.icon;
        
        return (
          <Card key={resumo.categoria} className={`border-l-4 ${config.borderColor}`}>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`h-5 w-5 ${config.iconColor}`} />
                <h3 className={`font-semibold ${config.titleColor}`}>{resumo.titulo}</h3>
              </div>
              
              <p className="text-3xl font-bold text-foreground">
                {resumo.num_clientes} <span className="text-lg font-normal text-muted-foreground">clientes</span>
              </p>
              
              <p className="text-lg text-muted-foreground mt-1">
                R$ {formatCurrency(resumo.faturamento_total)}
              </p>
              
              <Badge className={`${config.badgeBg} mt-3`}>
                {resumo.percentual_faturamento.toFixed(1)}% da Receita • {resumo.percentual_clientes.toFixed(1)}% dos clientes
              </Badge>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
