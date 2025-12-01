
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search } from 'lucide-react';
import { ClienteCurvaABC } from '@/hooks/useCurvaABC';

interface CurvaABCTableProps {
  clientes: ClienteCurvaABC[];
  isLoading: boolean;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

const getBadgeVariant = (categoria: 'A' | 'B' | 'C') => {
  switch (categoria) {
    case 'A':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'B':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'C':
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

export function CurvaABCTable({ clientes, isLoading }: CurvaABCTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas');

  const clientesFiltrados = clientes.filter(cliente => {
    const matchSearch = cliente.cliente_nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategoria = filtroCategoria === 'todas' || cliente.categoria === filtroCategoria;
    return matchSearch && matchCategoria;
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Clientes por Curva ABC</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <CardTitle className="text-lg">Clientes por Curva ABC</CardTitle>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-full sm:w-64"
            />
          </div>
          
          <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              <SelectItem value="A">🟢 Curva A</SelectItem>
              <SelectItem value="B">🟡 Curva B</SelectItem>
              <SelectItem value="C">⚪ Curva C</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-14 text-center">#</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-right">Faturamento Total</TableHead>
                <TableHead className="text-right">% do Total</TableHead>
                <TableHead className="text-right">Acumulado</TableHead>
                <TableHead className="text-center">Curva</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientesFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Nenhum cliente encontrado
                  </TableCell>
                </TableRow>
              ) : (
                clientesFiltrados.map((cliente, index) => (
                  <TableRow key={cliente.cliente_id}>
                    <TableCell className="text-center font-medium text-muted-foreground">
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">{cliente.cliente_nome}</p>
                        {cliente.representante_nome && (
                          <p className="text-xs text-muted-foreground">{cliente.representante_nome}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      R$ {formatCurrency(cliente.faturamento_total)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {cliente.percentual_do_total.toFixed(2)}%
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {cliente.percentual_acumulado.toFixed(2)}%
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={getBadgeVariant(cliente.categoria)}>
                        {cliente.categoria}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        <p className="text-sm text-muted-foreground mt-4">
          Exibindo {clientesFiltrados.length} de {clientes.length} clientes
        </p>
      </CardContent>
    </Card>
  );
}
