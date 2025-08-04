
import { useState, useMemo } from 'react';

export type SortDirection = 'asc' | 'desc' | null;

export interface SortConfig {
  key: string;
  direction: SortDirection;
}

export function useTableSort<T>(data: T[], initialSortKey?: string) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: initialSortKey || '',
    direction: null
  });

  const sortedData = useMemo(() => {
    if (sortConfig.direction === null) {
      return data;
    }

    return [...data].sort((a, b) => {
      const aValue = getNestedValue(a, sortConfig.key);
      const bValue = getNestedValue(b, sortConfig.key);

      if (aValue === bValue) return 0;

      const comparison = compareValues(aValue, bValue);
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  }, [data, sortConfig]);

  const requestSort = (key: string) => {
    let direction: SortDirection = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = null;
    }
    setSortConfig({ key, direction });
  };

  return {
    sortedData,
    sortConfig,
    requestSort
  };
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

function compareValues(a: any, b: any): number {
  // Handle dates
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() - b.getTime();
  }
  
  // Handle date strings
  if (typeof a === 'string' && typeof b === 'string' && 
      (a.match(/^\d{4}-\d{2}-\d{2}/) || a.match(/^\d{2}\/\d{2}\/\d{4}/))) {
    const dateA = new Date(a);
    const dateB = new Date(b);
    if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
      return dateA.getTime() - dateB.getTime();
    }
  }
  
  // Handle numbers
  if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  }
  
  // Handle strings (case insensitive)
  if (typeof a === 'string' && typeof b === 'string') {
    return a.toLowerCase().localeCompare(b.toLowerCase());
  }
  
  // Handle mixed types - convert to string
  return String(a).toLowerCase().localeCompare(String(b).toLowerCase());
}
