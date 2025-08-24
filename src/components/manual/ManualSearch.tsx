
import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import { manualSections } from '@/data/manualData';
import { ManualStep } from '@/types/manual';

interface SearchResult {
  sectionId: string;
  sectionTitle: string;
  stepId: string;
  stepTitle: string;
  stepDescription: string;
}

interface ManualSearchProps {
  onResultClick: (sectionId: string, stepId: string) => void;
}

export default function ManualSearch({ onResultClick }: ManualSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];

    const results: SearchResult[] = [];
    const term = searchTerm.toLowerCase();

    manualSections.forEach(section => {
      section.steps.forEach(step => {
        if (
          step.title.toLowerCase().includes(term) ||
          step.description.toLowerCase().includes(term) ||
          section.title.toLowerCase().includes(term)
        ) {
          results.push({
            sectionId: section.id,
            sectionTitle: section.title,
            stepId: step.id,
            stepTitle: step.title,
            stepDescription: step.description
          });
        }
      });
    });

    return results.slice(0, 8); // Limitar a 8 resultados
  }, [searchTerm]);

  const handleResultClick = (result: SearchResult) => {
    onResultClick(result.sectionId, result.stepId);
    setSearchTerm('');
    setIsOpen(false);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Buscar no manual..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="pl-10 pr-10"
        />
        {searchTerm && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && searchResults.length > 0 && (
        <div className="absolute top-full left-0 right-0 bg-background border rounded-md shadow-lg z-50 mt-1 max-h-80 overflow-y-auto">
          {searchResults.map((result, index) => (
            <div
              key={`${result.sectionId}-${result.stepId}`}
              className="p-3 hover:bg-accent cursor-pointer border-b last:border-b-0"
              onClick={() => handleResultClick(result)}
            >
              <div className="font-medium text-sm">{result.stepTitle}</div>
              <div className="text-xs text-muted-foreground">{result.sectionTitle}</div>
              <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {result.stepDescription}
              </div>
            </div>
          ))}
        </div>
      )}

      {isOpen && searchTerm && searchResults.length === 0 && (
        <div className="absolute top-full left-0 right-0 bg-background border rounded-md shadow-lg z-50 mt-1 p-3">
          <div className="text-sm text-muted-foreground">
            Nenhum resultado encontrado para "{searchTerm}"
          </div>
        </div>
      )}
    </div>
  );
}
