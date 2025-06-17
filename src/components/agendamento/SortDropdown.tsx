
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { ChevronDown, ArrowUp, ArrowDown } from "lucide-react";

export type SortField = 'data' | 'nome' | 'status' | 'tipo';
export type SortDirection = 'asc' | 'desc';

interface SortOption {
  field: SortField;
  label: string;
}

interface SortDropdownProps {
  sortField: SortField;
  sortDirection: SortDirection;
  onSortChange: (field: SortField, direction: SortDirection) => void;
}

const sortOptions: SortOption[] = [
  { field: 'data', label: 'Data' },
  { field: 'nome', label: 'Nome' },
  { field: 'status', label: 'Status' },
  { field: 'tipo', label: 'Tipo' }
];

export default function SortDropdown({ sortField, sortDirection, onSortChange }: SortDropdownProps) {
  const currentOption = sortOptions.find(option => option.field === sortField);
  
  const handleSortFieldChange = (field: SortField) => {
    onSortChange(field, sortDirection);
  };

  const handleDirectionToggle = () => {
    onSortChange(sortField, sortDirection === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2">
            {currentOption?.label || 'Data'}
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="bg-white border shadow-lg">
          {sortOptions.map((option) => (
            <DropdownMenuItem
              key={option.field}
              onClick={() => handleSortFieldChange(option.field)}
              className={`cursor-pointer hover:bg-gray-100 ${
                sortField === option.field ? 'bg-blue-50 text-blue-700' : ''
              }`}
            >
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="outline"
        size="sm"
        onClick={handleDirectionToggle}
        className="flex items-center gap-1"
      >
        {sortDirection === 'asc' ? (
          <>
            <ArrowUp className="h-4 w-4" />
            Crescente
          </>
        ) : (
          <>
            <ArrowDown className="h-4 w-4" />
            Decrescente
          </>
        )}
      </Button>
    </div>
  );
}
