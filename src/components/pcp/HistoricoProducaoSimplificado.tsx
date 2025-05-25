
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { History, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface HistoricoItem {
  id: number;
  dataProducao: Date;
  origem: 'Manual' | 'Agendada';
  produtoNome: string;
  formasProducidas: number;
  unidadesCalculadas: number;
  observacoes?: string;
}

export default function HistoricoProducaoSimplificado() {
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);

  // Load historical data from localStorage
  useEffect(() => {
    const historicoSalvo = localStorage.getItem('historico-producao');
    if (historicoSalvo) {
      try {
        const dados = JSON.parse(historicoSalvo);
        setHistorico(dados.map((item: any) => ({
          ...item,
          dataProducao: new Date(item.dataProducao)
        })));
      } catch (error) {
        console.error('Erro ao carregar histórico:', error);
      }
    }
  }, []);

  // Function to add production to history (will be called from other components)
  const adicionarAoHistorico = (item: Omit<HistoricoItem, 'id'>) => {
    const novoItem: HistoricoItem = {
      ...item,
      id: Date.now() + Math.random()
    };
    
    const novoHistorico = [novoItem, ...historico].slice(0, 100); // Keep only last 100 entries
    setHistorico(novoHistorico);
    
    // Save to localStorage
    localStorage.setItem('historico-producao', JSON.stringify(novoHistorico));
  };

  // Expose function globally for other components to use
  useEffect(() => {
    (window as any).adicionarProducaoAoHistorico = adicionarAoHistorico;
    
    return () => {
      delete (window as any).adicionarProducaoAoHistorico;
    };
  }, [historico]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico de Produção
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-right">Formas</TableHead>
                  <TableHead className="text-right">Unidades</TableHead>
                  <TableHead>Observações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historico.length > 0 ? (
                  historico.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{format(item.dataProducao, 'dd/MM/yyyy')}</TableCell>
                      <TableCell>
                        <Badge variant={item.origem === 'Manual' ? 'default' : 'secondary'}>
                          {item.origem}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{item.produtoNome}</TableCell>
                      <TableCell className="text-right">{item.formasProducidas}</TableCell>
                      <TableCell className="text-right">{item.unidadesCalculadas}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.observacoes || '-'}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        Nenhum registro de produção encontrado
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
