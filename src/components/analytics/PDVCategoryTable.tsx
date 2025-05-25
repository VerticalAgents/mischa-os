
import { useState, useEffect } from "react";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, ArrowUpDown } from "lucide-react";
import { Cliente } from "@/hooks/useClientesSupabase";
import { DREData, Channel } from "@/types/projections";
import { useProjectionStore } from "@/hooks/useProjectionStore";

type CategoryData = {
  categoryName: string;
  count: number;
  percentage: number;
  revenuePercentage: number;
  avgWeeklyOrders: number;
};

type SortField = 'categoryName' | 'count' | 'percentage' | 'revenuePercentage' | 'avgWeeklyOrders';
type SortDirection = 'asc' | 'desc';

interface PDVCategoryTableProps {
  clientes: Cliente[];
  baseDRE: DREData | null;
}

export function PDVCategoryTable({ clientes, baseDRE }: PDVCategoryTableProps) {
  const [categoriesData, setCategoriesData] = useState<CategoryData[]>([]);
  const [sortField, setSortField] = useState<SortField>('count');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const { getClientChannel } = useProjectionStore();
  
  // Process clients data to generate categories
  useEffect(() => {
    if (clientes.length === 0) return;
    
    // Group clients by category
    const categoryMap = new Map<string, Cliente[]>();
    
    // Group by category establishment (we'll use a fallback if no category is set)
    clientes.forEach(cliente => {
      // Use categoria_estabelecimento_id or fallback
      const categoryId = cliente.categoria_estabelecimento_id || 0;
      const categoryName = getCategoryNameById(categoryId);
      
      if (!categoryMap.has(categoryName)) {
        categoryMap.set(categoryName, []);
      }
      categoryMap.get(categoryName)?.push(cliente);
    });
    
    // Calculate revenue percentages from DRE if available
    const channelRevenues = new Map<Channel, number>();
    if (baseDRE) {
      baseDRE.channelsData.forEach(channel => {
        channelRevenues.set(channel.channel, channel.revenue);
      });
    }
    
    // Map category data
    const data: CategoryData[] = [];
    let totalClients = clientes.length;
    
    categoryMap.forEach((clients, categoryName) => {
      // Calculate avg weekly orders
      let totalWeeklyOrders = 0;
      clients.forEach(client => {
        // Calculate weekly volume based on standard quantity and periodicity
        const quantidadePadrao = client.quantidade_padrao || 0;
        const periodicidadePadrao = client.periodicidade_padrao || 7;
        totalWeeklyOrders += quantidadePadrao * (7 / periodicidadePadrao);
      });
      
      // Calculate revenue percentage
      let revenuePercentage = 0;
      if (baseDRE) {
        // Map clients to channels and calculate revenue share
        const channelCounts = new Map<Channel, number>();
        clients.forEach(client => {
          const channel = getClientChannel(client.id);
          channelCounts.set(channel, (channelCounts.get(channel) || 0) + 1);
        });
        
        // Calculate revenue contribution
        let categoryRevenue = 0;
        let totalRevenue = baseDRE.totalRevenue;
        
        channelCounts.forEach((count, channel) => {
          const channelRevenue = channelRevenues.get(channel) || 0;
          // Estimate category's share of this channel's revenue
          const clientsInChannel = clientes.filter(c => getClientChannel(c.id) === channel).length;
          if (clientsInChannel > 0) {
            categoryRevenue += (count / clientsInChannel) * channelRevenue;
          }
        });
        
        revenuePercentage = totalRevenue > 0 ? (categoryRevenue / totalRevenue) * 100 : 0;
      }
      
      data.push({
        categoryName,
        count: clients.length,
        percentage: (clients.length / totalClients) * 100,
        revenuePercentage,
        avgWeeklyOrders: clients.length > 0 ? totalWeeklyOrders / clients.length : 0
      });
    });
    
    // Sort the data
    sortData(data, sortField, sortDirection);
    setCategoriesData(data);
  }, [clientes, baseDRE, sortField, sortDirection, getClientChannel]);
  
  // Sort data function
  const sortData = (data: CategoryData[], field: SortField, direction: SortDirection) => {
    data.sort((a, b) => {
      let comparison = 0;
      
      switch (field) {
        case 'categoryName':
          comparison = a.categoryName.localeCompare(b.categoryName);
          break;
        case 'count':
          comparison = a.count - b.count;
          break;
        case 'percentage':
          comparison = a.percentage - b.percentage;
          break;
        case 'revenuePercentage':
          comparison = a.revenuePercentage - b.revenuePercentage;
          break;
        case 'avgWeeklyOrders':
          comparison = a.avgWeeklyOrders - b.avgWeeklyOrders;
          break;
      }
      
      return direction === 'asc' ? comparison : -comparison;
    });
  };
  
  // Toggle sort
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  // Export data as CSV
  const exportToCSV = () => {
    // Headers
    let csv = "Categoria,Quantidade,Percentual,Percentual Faturamento,Giro Semanal Médio\n";
    
    // Add data rows
    categoriesData.forEach(category => {
      csv += `${category.categoryName},${category.count},${category.percentage.toFixed(2)}%,${category.revenuePercentage.toFixed(2)}%,${category.avgWeeklyOrders.toFixed(1)}\n`;
    });
    
    // Create download link
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'categorias_pdv.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Helper to get category name by ID
  function getCategoryNameById(id: number): string {
    switch (id) {
      case 1: return "Restaurante";
      case 2: return "Bar";
      case 3: return "Cafeteria";
      case 4: return "Lanchonete";
      case 5: return "Padaria";
      case 6: return "Conveniência";
      default: return "Outros";
    }
  }
  
  // Calculate totals for footer
  const totalCount = categoriesData.reduce((sum, cat) => sum + cat.count, 0);
  const totalAvgWeeklyOrders = categoriesData.length > 0 
    ? categoriesData.reduce((sum, cat) => sum + (cat.avgWeeklyOrders * cat.count), 0) / totalCount 
    : 0;
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Perfil de PDVs por Categoria</CardTitle>
          <CardDescription>Análise de distribuição e performance por tipo de estabelecimento</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={exportToCSV}>
          <Download className="mr-2 h-4 w-4" />
          Exportar CSV
        </Button>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead onClick={() => toggleSort('categoryName')} className="cursor-pointer">
                  Categoria
                  <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                </TableHead>
                <TableHead onClick={() => toggleSort('count')} className="text-right cursor-pointer">
                  Qtd
                  <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                </TableHead>
                <TableHead onClick={() => toggleSort('percentage')} className="text-right cursor-pointer">
                  %
                  <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                </TableHead>
                <TableHead onClick={() => toggleSort('revenuePercentage')} className="text-right cursor-pointer">
                  % Faturamento
                  <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                </TableHead>
                <TableHead onClick={() => toggleSort('avgWeeklyOrders')} className="text-right cursor-pointer">
                  Giro Semanal Médio
                  <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categoriesData.map((category) => (
                <TableRow key={category.categoryName}>
                  <TableCell className="font-medium">{category.categoryName}</TableCell>
                  <TableCell className="text-right">{category.count}</TableCell>
                  <TableCell className="text-right">{category.percentage.toFixed(1)}%</TableCell>
                  <TableCell className="text-right">{category.revenuePercentage.toFixed(1)}%</TableCell>
                  <TableCell className="text-right">{category.avgWeeklyOrders.toFixed(1)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableCaption>
              <div className="flex justify-between text-sm font-medium">
                <div>Total: {totalCount} PDVs</div>
                <div>Giro Semanal Médio Global: {totalAvgWeeklyOrders.toFixed(1)}</div>
              </div>
            </TableCaption>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
