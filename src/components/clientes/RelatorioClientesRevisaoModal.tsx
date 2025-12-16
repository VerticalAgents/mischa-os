import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Download, Search, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useClienteStore } from '@/hooks/useClienteStore';

interface RelatorioClientesRevisaoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RelatorioClientesRevisaoModal({ open, onOpenChange }: RelatorioClientesRevisaoModalProps) {
  const { clientes } = useClienteStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterIssues, setFilterIssues] = useState(false);

  const clientesAtivos = useMemo(() => {
    return clientes.filter(c => c.ativo);
  }, [clientes]);

  const clientesComAnalise = useMemo(() => {
    return clientesAtivos.map(cliente => {
      const cnpjNormalizado = cliente.cnpjCpf?.replace(/[^\d]/g, '') || '';
      const temCnpj = cnpjNormalizado.length >= 11;
      const formaPagamentoNormalizada = normalizarFormaPagamento(cliente.formaPagamento);
      const tipoCobrancaNormalizado = normalizarTipoCobranca(cliente.tipoCobranca);
      
      const issues: string[] = [];
      if (!temCnpj) issues.push('CNPJ/CPF ausente');
      if (formaPagamentoNormalizada === 'INDEFINIDO') issues.push('Forma pagamento inválida');
      if (tipoCobrancaNormalizado === 'INDEFINIDO') issues.push('Tipo cobrança inválido');
      
      return {
        id: cliente.id,
        nome: cliente.nome,
        cnpjCpf: cliente.cnpjCpf || '',
        cnpjFormatado: formatarCnpjCpf(cnpjNormalizado),
        formaPagamento: cliente.formaPagamento || '',
        formaPagamentoNormalizada,
        tipoCobranca: cliente.tipoCobranca || '',
        tipoCobrancaNormalizado,
        statusCliente: cliente.statusCliente,
        temCnpj,
        issues,
        temProblema: issues.length > 0,
      };
    });
  }, [clientesAtivos]);

  const clientesFiltrados = useMemo(() => {
    return clientesComAnalise
      .filter(c => {
        const matchSearch = c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.cnpjCpf.includes(searchTerm);
        const matchFilter = !filterIssues || c.temProblema;
        return matchSearch && matchFilter;
      })
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [clientesComAnalise, searchTerm, filterIssues]);

  const estatisticas = useMemo(() => {
    const total = clientesComAnalise.length;
    const semCnpj = clientesComAnalise.filter(c => !c.temCnpj).length;
    const comProblemas = clientesComAnalise.filter(c => c.temProblema).length;
    const ok = total - comProblemas;
    return { total, semCnpj, comProblemas, ok };
  }, [clientesComAnalise]);

  const exportarCSV = () => {
    const headers = [
      'Nome',
      'CNPJ/CPF (Original)',
      'CNPJ/CPF (Formatado)',
      'Forma Pagamento (Original)',
      'Forma Pagamento (Sugerida)',
      'Tipo Cobrança (Original)',
      'Tipo Cobrança (Sugerido)',
      'Status',
      'Problemas'
    ];

    const rows = clientesFiltrados.map(c => [
      c.nome,
      c.cnpjCpf,
      c.cnpjFormatado,
      c.formaPagamento,
      c.formaPagamentoNormalizada,
      c.tipoCobranca,
      c.tipoCobrancaNormalizado,
      c.statusCliente,
      c.issues.join('; ')
    ]);

    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(';'))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `revisao_clientes_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Relatório de Revisão de Clientes - Integração GestãoClick</DialogTitle>
        </DialogHeader>

        {/* Estatísticas */}
        <div className="grid grid-cols-4 gap-3 py-3">
          <div className="bg-muted rounded-lg p-3 text-center">
            <div className="text-2xl font-bold">{estatisticas.total}</div>
            <div className="text-xs text-muted-foreground">Total Ativos</div>
          </div>
          <div className="bg-green-500/10 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-600">{estatisticas.ok}</div>
            <div className="text-xs text-muted-foreground">OK</div>
          </div>
          <div className="bg-amber-500/10 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-amber-600">{estatisticas.comProblemas}</div>
            <div className="text-xs text-muted-foreground">Com Problemas</div>
          </div>
          <div className="bg-red-500/10 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-red-600">{estatisticas.semCnpj}</div>
            <div className="text-xs text-muted-foreground">Sem CNPJ/CPF</div>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex gap-3 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou CNPJ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant={filterIssues ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterIssues(!filterIssues)}
          >
            <AlertTriangle className="h-4 w-4 mr-1" />
            Só com problemas
          </Button>
          <Button onClick={exportarCSV} size="sm">
            <Download className="h-4 w-4 mr-1" />
            Exportar CSV
          </Button>
        </div>

        {/* Tabela */}
        <div className="flex-1 overflow-auto border rounded-lg">
          <Table>
            <TableHeader className="sticky top-0 bg-background">
              <TableRow>
                <TableHead className="w-8">OK</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>CNPJ/CPF</TableHead>
                <TableHead>Forma Pagamento</TableHead>
                <TableHead>Tipo Cobrança</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Problemas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientesFiltrados.map((cliente) => (
                <TableRow key={cliente.id} className={cliente.temProblema ? 'bg-amber-500/5' : ''}>
                  <TableCell>
                    {cliente.temProblema ? (
                      <XCircle className="h-4 w-4 text-red-500" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{cliente.nome}</TableCell>
                  <TableCell>
                    {cliente.temCnpj ? (
                      <span className="font-mono text-xs">{cliente.cnpjFormatado}</span>
                    ) : (
                      <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50">
                        Ausente
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-muted-foreground line-through">
                        {cliente.formaPagamento || '-'}
                      </span>
                      <Badge variant="secondary" className="w-fit text-xs">
                        {cliente.formaPagamentoNormalizada}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-muted-foreground line-through">
                        {cliente.tipoCobranca || '-'}
                      </span>
                      <Badge variant="secondary" className="w-fit text-xs">
                        {cliente.tipoCobrancaNormalizado}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {cliente.statusCliente}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {cliente.issues.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {cliente.issues.map((issue, i) => (
                          <Badge key={i} variant="destructive" className="text-xs">
                            {issue}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="text-xs text-muted-foreground pt-2">
          Exibindo {clientesFiltrados.length} de {estatisticas.total} clientes ativos
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Funções auxiliares
function normalizarFormaPagamento(valor: string | undefined | null): string {
  if (!valor) return 'INDEFINIDO';
  const upper = valor.toUpperCase().trim();
  if (upper.includes('BOLETO')) return 'BOLETO';
  if (upper.includes('PIX')) return 'PIX';
  if (upper.includes('DINHEIRO') || upper.includes('ESPÉCIE') || upper.includes('ESPECIE')) return 'DINHEIRO';
  if (upper.includes('CARTAO') || upper.includes('CARTÃO')) return 'CARTAO';
  return 'INDEFINIDO';
}

function normalizarTipoCobranca(valor: string | undefined | null): string {
  if (!valor) return 'INDEFINIDO';
  const upper = valor.toUpperCase().trim().replace(/[_\s]+/g, ' ');
  if (upper.includes('VISTA') || upper.includes('À VISTA') || upper.includes('A VISTA')) return 'A_VISTA';
  if (upper.includes('PRAZO')) return 'A_PRAZO';
  return 'INDEFINIDO';
}

function formatarCnpjCpf(valor: string): string {
  if (!valor) return '';
  const numeros = valor.replace(/\D/g, '');
  if (numeros.length === 11) {
    return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  if (numeros.length === 14) {
    return numeros.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  return valor;
}
