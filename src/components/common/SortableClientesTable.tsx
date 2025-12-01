import React, { useMemo, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown } from "lucide-react";
import { calcularGiroSemanalHistoricoSync } from "@/utils/giroCalculations";
import { useHistoricoEntregasStore } from "@/hooks/useHistoricoEntregasStore";
import { ExplicacaoCalculoProps } from "@/components/common/TooltipExplicativo";
import SortableTableHeader from "@/components/common/SortableTableHeader";
import { useTableSort } from "@/hooks/useTableSort";

type SortField = 'nome' | 'giro' | 'status' | 'achievement' | 'entregas' | 'dias' | 'ultimaEntrega';

interface Cliente {
  id: string;
  nome: string;
  statusCliente: string;
  quantidadePadrao?: number;
  metaGiroSemanal?: number;
}

interface SortableClientesTableProps {
  clientes: Cliente[];
  titulo: string;
  showDeliveryStats?: boolean;
}

// Explicações para tooltips
const explicacoes: Record<string, ExplicacaoCalculoProps> = {
  giro: {
    titulo: "Giro Semanal",
    explicacao: "Representa a quantidade de produtos vendidos por semana para este cliente, calculada com base no histórico de entregas.",
    formula: "Soma de todas as entregas ÷ Número de semanas com entregas",
    exemplo: "Cliente com 100 unidades entregues em 5 semanas = 20 unidades/semana",
    observacoes: [
      "Considera apenas entregas confirmadas",
      "Clientes sem histórico mostram 0",
      "Cálculo baseado em dados reais de entrega"
    ],
    fontes: ["Histórico de Entregas", "Registro de Expedição"]
  },
  achievement: {
    titulo: "Achievement da Meta",
    explicacao: "Percentual de atingimento da meta de giro semanal estabelecida para o cliente.",
    formula: "(Giro Real ÷ Meta Semanal) × 100",
    exemplo: "Giro real 15, meta 20 = 75% de achievement",
    observacoes: [
      "Metas definidas no cadastro do cliente",
      "Verde: ≥100%, Amarelo: 70-99%, Vermelho: <70%",
      "Clientes sem meta mostram 0%"
    ],
    fontes: ["Meta do Cliente", "Giro Calculado"]
  },
  entregas: {
    titulo: "Total de Entregas",
    explicacao: "Número total de entregas realizadas para este cliente desde o primeiro registro.",
    observacoes: [
      "Inclui todas as entregas confirmadas",
      "Usado para determinar elegibilidade para ativação",
      "Mínimo 4 entregas para ativação automática"
    ],
    fontes: ["Histórico de Entregas"]
  },
  dias: {
    titulo: "Dias desde Primeira Entrega",
    explicacao: "Número de dias corridos desde a primeira entrega registrada para este cliente.",
    observacoes: [
      "Conta apenas dias corridos",
      "Usado para análise de tempo de relacionamento",
      "Clientes sem entregas mostram 0 dias"
    ],
    fontes: ["Histórico de Entregas"]
  },
  ultimaEntrega: {
    titulo: "Última Entrega",
    explicacao: "Dias transcorridos desde a última entrega realizada para este cliente.",
    observacoes: [
      "Indicador de recência do relacionamento",
      "Clientes sem entregas mostram 'Sem entregas'",
      "Útil para identificar clientes dormentes"
    ],
    fontes: ["Histórico de Entregas"]
  }
};

export default function SortableClientesTable({ 
  clientes, 
  titulo, 
  showDeliveryStats = false 
}: SortableClientesTableProps) {
  const { registros } = useHistoricoEntregasStore();
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'nome',
    direction: 'asc'
  });
  
  const requestSort = (key: string) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getDeliveryStats = useMemo(() => (clienteId: string) => {
    const entregas = registros.filter(h => h.cliente_id === clienteId && h.tipo === 'entrega');
    const totalEntregas = entregas.length;
    
    if (totalEntregas === 0) return { count: 0, daysSinceFirst: 0, daysSinceLastDelivery: null, canActivate: false };
    
    const primeiraEntrega = new Date(Math.min(...entregas.map(e => new Date(e.data).getTime())));
    const ultimaEntrega = new Date(Math.max(...entregas.map(e => new Date(e.data).getTime())));
    const hoje = new Date();
    const daysSinceFirst = Math.floor((hoje.getTime() - primeiraEntrega.getTime()) / (1000 * 60 * 60 * 24));
    const daysSinceLastDelivery = Math.floor((hoje.getTime() - ultimaEntrega.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      count: totalEntregas,
      daysSinceFirst,
      daysSinceLastDelivery,
      canActivate: totalEntregas >= 4
    };
  }, [registros]);

  const sortedClientes = useMemo(() => {
    return [...clientes].sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortConfig.key) {
        case 'giro':
          aValue = calcularGiroSemanalHistoricoSync(a.id, registros);
          bValue = calcularGiroSemanalHistoricoSync(b.id, registros);
          break;
        case 'achievement':
          const giroA = calcularGiroSemanalHistoricoSync(a.id, registros);
          const giroB = calcularGiroSemanalHistoricoSync(b.id, registros);
          aValue = a.metaGiroSemanal ? (giroA / a.metaGiroSemanal) * 100 : 0;
          bValue = b.metaGiroSemanal ? (giroB / b.metaGiroSemanal) * 100 : 0;
          break;
        case 'entregas':
          aValue = getDeliveryStats(a.id).count;
          bValue = getDeliveryStats(b.id).count;
          break;
        case 'dias':
          aValue = getDeliveryStats(a.id).daysSinceFirst;
          bValue = getDeliveryStats(b.id).daysSinceFirst;
          break;
        case 'ultimaEntrega':
          const statsA = getDeliveryStats(a.id);
          const statsB = getDeliveryStats(b.id);
          aValue = statsA.daysSinceLastDelivery ?? 999999;
          bValue = statsB.daysSinceLastDelivery ?? 999999;
          break;
        case 'status':
          aValue = a.statusCliente;
          bValue = b.statusCliente;
          break;
        default:
          aValue = a.nome;
          bValue = b.nome;
      }

      if (typeof aValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      }
      
      const comparison = aValue - bValue;
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [clientes, sortConfig, registros, getDeliveryStats]);

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'Ativo': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'Em análise': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'A ativar': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'Standby': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      case 'Inativo': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  if (clientes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-left">{titulo}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Nenhum cliente encontrado nesta categoria
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-left">{titulo}</CardTitle>
        <CardDescription className="text-left">
          {clientes.length} cliente{clientes.length !== 1 ? 's' : ''} encontrado{clientes.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHeader 
                  sortKey="nome" 
                  sortConfig={sortConfig} 
                  onSort={requestSort}
                >
                  Nome
                </SortableTableHeader>
                
                <SortableTableHeader 
                  sortKey="status" 
                  sortConfig={sortConfig} 
                  onSort={requestSort}
                >
                  Status
                </SortableTableHeader>
                
                <SortableTableHeader 
                  sortKey="giro" 
                  sortConfig={sortConfig} 
                  onSort={requestSort}
                  tooltip={explicacoes.giro}
                >
                  Giro Semanal
                </SortableTableHeader>
                
                <SortableTableHeader 
                  sortKey="achievement" 
                  sortConfig={sortConfig} 
                  onSort={requestSort}
                  tooltip={explicacoes.achievement}
                >
                  Achievement
                </SortableTableHeader>
                
                <SortableTableHeader 
                  sortKey="ultimaEntrega" 
                  sortConfig={sortConfig} 
                  onSort={requestSort}
                  tooltip={explicacoes.ultimaEntrega}
                >
                  Última Entrega
                </SortableTableHeader>

                {showDeliveryStats && (
                  <>
                    <SortableTableHeader 
                      sortKey="entregas" 
                      sortConfig={sortConfig} 
                      onSort={requestSort}
                      tooltip={explicacoes.entregas}
                    >
                      Total Entregas
                    </SortableTableHeader>
                    
                    <SortableTableHeader 
                      sortKey="dias" 
                      sortConfig={sortConfig} 
                      onSort={requestSort}
                      tooltip={explicacoes.dias}
                    >
                      Dias Ativo
                    </SortableTableHeader>
                  </>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedClientes.map((cliente) => {
                const giro = calcularGiroSemanalHistoricoSync(cliente.id, registros);
                const achievement = cliente.metaGiroSemanal ? (giro / cliente.metaGiroSemanal) * 100 : 0;
                const deliveryStats = showDeliveryStats ? getDeliveryStats(cliente.id) : null;
                const lastDeliveryStats = getDeliveryStats(cliente.id);

                return (
                  <TableRow key={cliente.id}>
                    <TableCell className="text-left font-medium">
                      {cliente.nome.substring(0, 40)}
                      {cliente.nome.length > 40 && '...'}
                      {deliveryStats?.canActivate && (
                        <Badge className="ml-2 bg-green-100 text-green-800 text-xs">
                          Pronto para Ativar
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-left">
                      <Badge className={getStatusBadgeColor(cliente.statusCliente)}>
                        {cliente.statusCliente}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-left font-mono">
                      {giro.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-left font-mono">
                      {achievement.toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-left">
                      {(() => {
                        const stats = lastDeliveryStats;
                        return stats.daysSinceLastDelivery !== null ? (
                          <span className="text-sm">
                            {stats.daysSinceLastDelivery === 0 ? 'Hoje' : 
                             stats.daysSinceLastDelivery === 1 ? '1 dia' : 
                             `${stats.daysSinceLastDelivery} dias`}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">Sem entregas</span>
                        );
                      })()}
                    </TableCell>
                    {showDeliveryStats && deliveryStats && (
                      <>
                        <TableCell className="text-left font-mono">
                          {deliveryStats.count}
                        </TableCell>
                        <TableCell className="text-left font-mono">
                          {deliveryStats.daysSinceFirst}
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}