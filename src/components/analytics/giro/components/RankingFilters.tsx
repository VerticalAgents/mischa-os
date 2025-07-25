
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';

interface RankingFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  sortBy: string;
  onSortChange: (value: string) => void;
  filterPerformance: string;
  onFilterPerformanceChange: (value: string) => void;
}

export function RankingFilters({
  searchTerm,
  onSearchChange,
  sortBy,
  onSortChange,
  filterPerformance,
  onFilterPerformanceChange
}: RankingFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar cliente..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      
      <Select value={sortBy} onValueChange={onSortChange}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Ordenar por" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="giro_historico">Giro Histórico</SelectItem>
          <SelectItem value="achievement">Achievement</SelectItem>
          <SelectItem value="variacao">Variação</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filterPerformance} onValueChange={onFilterPerformanceChange}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Filtrar por performance" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos</SelectItem>
          <SelectItem value="verde">🟢 Verde</SelectItem>
          <SelectItem value="amarelo">🟡 Amarelo</SelectItem>
          <SelectItem value="vermelho">🔴 Vermelho</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
