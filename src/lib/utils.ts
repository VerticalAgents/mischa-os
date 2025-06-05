
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | null): string {
  if (!date) return "--/--/----";
  
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

// Nova função para formatação de data sem conversão de timezone
export function formatDateSafe(dateValue: Date | string | null): string {
  if (!dateValue) return "--/--/----";
  
  // Se for string no formato YYYY-MM-DD, extrair diretamente
  if (typeof dateValue === 'string' && dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [ano, mes, dia] = dateValue.split('-');
    return `${dia}/${mes}/${ano}`;
  }
  
  // Se for Date, usar formatação padrão
  if (dateValue instanceof Date) {
    const day = dateValue.getDate().toString().padStart(2, '0');
    const month = (dateValue.getMonth() + 1).toString().padStart(2, '0');
    const year = dateValue.getFullYear();
    return `${day}/${month}/${year}`;
  }
  
  return "--/--/----";
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency', 
    currency: 'BRL'
  }).format(value);
}
