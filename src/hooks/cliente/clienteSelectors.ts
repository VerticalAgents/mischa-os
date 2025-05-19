
import { Cliente, StatusCliente } from '../../types';

export const getClientesFiltrados = (clientes: Cliente[], filtros: { termo: string, status: StatusCliente | 'Todos' }) => {
  return clientes.filter(cliente => {
    // Filtro por termo
    const termoMatch = filtros.termo === '' || 
      cliente.nome.toLowerCase().includes(filtros.termo.toLowerCase()) ||
      (cliente.cnpjCpf && cliente.cnpjCpf.includes(filtros.termo));
    
    // Filtro por status
    const statusMatch = filtros.status === 'Todos' || cliente.statusCliente === filtros.status;
    
    return termoMatch && statusMatch;
  });
};

export const getClientePorId = (clientes: Cliente[], id: number): Cliente | undefined => {
  return clientes.find(c => c.id === id);
};
