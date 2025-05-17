
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Cliente, StatusCliente } from '../types';
import { clientesMock } from '../data/mockData';

// Dados dos clientes com giro semanal e periodicidade
const clientesComDados: Partial<Cliente>[] = [
  { nome: "AMPM (João Wallig)", quantidadePadrao: 15, periodicidadePadrao: 14, statusCliente: "Ativo", enderecoEntrega: "Av. Dr. João Wallig, 1800 - Passo da Areia, Porto Alegre - RS" },
  { nome: "Arena Sports Poa", quantidadePadrao: 15, periodicidadePadrao: 10, statusCliente: "Ativo", enderecoEntrega: "Av. Bento Gonçalves, 567 - Partenon, Porto Alegre - RS" },
  { nome: "Argentum", quantidadePadrao: 50, periodicidadePadrao: 7, statusCliente: "Ativo", enderecoEntrega: "R. 24 de Outubro, 111 - Moinhos de Vento, Porto Alegre - RS" },
  { nome: "Armazém da Redenção", quantidadePadrao: 20, periodicidadePadrao: 14, statusCliente: "Ativo", enderecoEntrega: "Av. José Bonifácio, 675 - Farroupilha, Porto Alegre - RS" },
  { nome: "Armazém do Sabor", quantidadePadrao: 7, periodicidadePadrao: 14, statusCliente: "A ativar", enderecoEntrega: "R. Padre Chagas, 342 - Moinhos de Vento, Porto Alegre - RS" },
  { nome: "Bampi", quantidadePadrao: 5, periodicidadePadrao: 21, statusCliente: "Ativo", enderecoEntrega: "R. Silva Jardim, 408 - Auxiliadora, Porto Alegre - RS" },
  { nome: "Bendita Esquina", quantidadePadrao: 15, periodicidadePadrao: 10, statusCliente: "Ativo", enderecoEntrega: "Av. Osvaldo Aranha, 960 - Bom Fim, Porto Alegre - RS" },
  { nome: "Boteco 787", quantidadePadrao: 15, periodicidadePadrao: 10, statusCliente: "Ativo", enderecoEntrega: "Av. Protásio Alves, 787 - Rio Branco, Porto Alegre - RS" },
  { nome: "Bruno - Distribuidor", quantidadePadrao: 120, periodicidadePadrao: 14, statusCliente: "Em análise", enderecoEntrega: "Av. Assis Brasil, 3522 - São Sebastião, Porto Alegre - RS" },
  { nome: "Cafeína e Gasolina", quantidadePadrao: 30, periodicidadePadrao: 7, statusCliente: "Ativo", enderecoEntrega: "R. Barão do Triunfo, 440 - Azenha, Porto Alegre - RS" },
  { nome: "CASL", quantidadePadrao: 15, periodicidadePadrao: 14, statusCliente: "Ativo", enderecoEntrega: "Av. Ipiranga, 6681 - Partenon, Porto Alegre - RS" },
  { nome: "Cavanhas Barão", quantidadePadrao: 8, periodicidadePadrao: 21, statusCliente: "Standby", enderecoEntrega: "Av. Barão do Amazonas, 123 - São Geraldo, Porto Alegre - RS" },
  { nome: "CECIV UFRGS", quantidadePadrao: 25, periodicidadePadrao: 14, statusCliente: "Ativo", enderecoEntrega: "Av. Paulo Gama, 110 - Farroupilha, Porto Alegre - RS" },
  { nome: "Cestas POA", quantidadePadrao: 20, periodicidadePadrao: 14, statusCliente: "Ativo", enderecoEntrega: "R. Ramiro Barcelos, 1450 - Rio Branco, Porto Alegre - RS" },
  { nome: "Chalet Suisse", quantidadePadrao: 20, periodicidadePadrao: 10, statusCliente: "Ativo", enderecoEntrega: "Av. Goethe, 100 - Rio Branco, Porto Alegre - RS" },
  { nome: "Confraria do Café", quantidadePadrao: 15, periodicidadePadrao: 7, statusCliente: "Ativo", enderecoEntrega: "Av. Independência, 820 - Independência, Porto Alegre - RS" },
  { nome: "Curtir e Celebrar Cestas", quantidadePadrao: 5, periodicidadePadrao: 21, statusCliente: "Inativo", enderecoEntrega: "R. Gonçalo de Carvalho, 330 - Floresta, Porto Alegre - RS" },
  { nome: "DAEAMB", quantidadePadrao: 20, periodicidadePadrao: 14, statusCliente: "Ativo", enderecoEntrega: "Av. Bento Gonçalves, 9500 - Agronomia, Porto Alegre - RS" },
  { nome: "DAPROD UFRGS", quantidadePadrao: 30, periodicidadePadrao: 14, statusCliente: "Ativo", enderecoEntrega: "Av. Paulo Gama, 110 - Farroupilha, Porto Alegre - RS" },
  { nome: "DCE UFCSPA", quantidadePadrao: 208, periodicidadePadrao: 7, statusCliente: "Ativo", enderecoEntrega: "R. Sarmento Leite, 245 - Centro Histórico, Porto Alegre - RS" },
  { nome: "Demarchi", quantidadePadrao: 15, periodicidadePadrao: 21, statusCliente: "A ativar", enderecoEntrega: "Av. Cristóvão Colombo, 545 - Floresta, Porto Alegre - RS" },
  { nome: "Divino Verde", quantidadePadrao: 90, periodicidadePadrao: 7, statusCliente: "Ativo", enderecoEntrega: "R. Quintino Bocaiúva, 707 - Moinhos de Vento, Porto Alegre - RS" },
  { nome: "E.E.E.E.F Jerônimo de Alb.", quantidadePadrao: 10, periodicidadePadrao: 21, statusCliente: "Ativo", enderecoEntrega: "R. Jerônimo de Ornelas, 55 - Santana, Porto Alegre - RS" },
  { nome: "Engenho do Pão", quantidadePadrao: 30, periodicidadePadrao: 10, statusCliente: "Ativo", enderecoEntrega: "R. Mariante, 288 - Rio Branco, Porto Alegre - RS" },
  { nome: "Eurostock Investimentos", quantidadePadrao: 30, periodicidadePadrao: 7, statusCliente: "Ativo", enderecoEntrega: "Av. Carlos Gomes, 300 - Auxiliadora, Porto Alegre - RS" },
  { nome: "Everest Pub", quantidadePadrao: 10, periodicidadePadrao: 28, statusCliente: "Ativo", enderecoEntrega: "R. Olavo Barreto Viana, 18 - Moinhos de Vento, Porto Alegre - RS" },
  { nome: "EWF Luta Livre", quantidadePadrao: 12, periodicidadePadrao: 28, statusCliente: "Ativo", enderecoEntrega: "R. Mostardeiro, 780 - Moinhos de Vento, Porto Alegre - RS" },
  { nome: "Giulia - Distribuidor", quantidadePadrao: 150, periodicidadePadrao: 3, statusCliente: "Ativo", enderecoEntrega: "Av. Borges de Medeiros, 2500 - Praia de Belas, Porto Alegre - RS" },
  { nome: "GL Assados", quantidadePadrao: 10, periodicidadePadrao: 28, statusCliente: "Standby", enderecoEntrega: "Av. Otto Niemeyer, 2500 - Cavalhada, Porto Alegre - RS" },
  { nome: "Guadalajara Formaturas", quantidadePadrao: 100, periodicidadePadrao: 10, statusCliente: "Ativo", enderecoEntrega: "Av. Ipiranga, 5200 - Azenha, Porto Alegre - RS" },
  { nome: "La Mafia (João Wallig)", quantidadePadrao: 10, periodicidadePadrao: 14, statusCliente: "Ativo", enderecoEntrega: "Av. Dr. João Wallig, 1800 - Passo da Areia, Porto Alegre - RS" },
  { nome: "La Mafia (Petrópolis)", quantidadePadrao: 7, periodicidadePadrao: 21, statusCliente: "Ativo", enderecoEntrega: "R. Lavras, 400 - Petrópolis, Porto Alegre - RS" },
  { nome: "Limas Bar", quantidadePadrao: 10, periodicidadePadrao: 10, statusCliente: "Ativo", enderecoEntrega: "R. Fernandes Vieira, 466 - Bom Fim, Porto Alegre - RS" },
  { nome: "Madri Padaria e Confeitaria", quantidadePadrao: 10, periodicidadePadrao: 21, statusCliente: "Ativo", enderecoEntrega: "Av. Cristóvão Colombo, 545 - Floresta, Porto Alegre - RS" },
  { nome: "MedCafé Fleming", quantidadePadrao: 15, periodicidadePadrao: 14, statusCliente: "Ativo", enderecoEntrega: "R. Prof. Annes Dias, 295 - Centro Histórico, Porto Alegre - RS" },
  { nome: "Mercado Pinheiro", quantidadePadrao: 40, periodicidadePadrao: 7, statusCliente: "Ativo", enderecoEntrega: "Av. Venâncio Aires, 1060 - Azenha, Porto Alegre - RS" },
  { nome: "Mercado Santiago", quantidadePadrao: 20, periodicidadePadrao: 7, statusCliente: "Ativo", enderecoEntrega: "R. Santiago, 725 - São Geraldo, Porto Alegre - RS" },
  { nome: "Moita", quantidadePadrao: 30, periodicidadePadrao: 7, statusCliente: "Ativo", enderecoEntrega: "R. Padre Chagas, 314 - Moinhos de Vento, Porto Alegre - RS" },
  { nome: "Onii Soluções Autônomas", quantidadePadrao: 15, periodicidadePadrao: 28, statusCliente: "Ativo", enderecoEntrega: "Av. Ipiranga, 6681 - Partenon, Porto Alegre - RS" },
  { nome: "Panetteria", quantidadePadrao: 40, periodicidadePadrao: 10, statusCliente: "Ativo", enderecoEntrega: "Av. Otto Niemeyer, 2565 - Camaquã, Porto Alegre - RS" },
  { nome: "Pé na Areia 1", quantidadePadrao: 20, periodicidadePadrao: 14, statusCliente: "Ativo", enderecoEntrega: "Av. Guaíba, 10435 - Ipanema, Porto Alegre - RS" },
  { nome: "REDEVIP24H (Aeroporto)", quantidadePadrao: 15, periodicidadePadrao: 10, statusCliente: "Ativo", enderecoEntrega: "Av. Severo Dullius, 90010 - Anchieta, Porto Alegre - RS" },
  { nome: "REDEVIP24H (Anita)", quantidadePadrao: 18, periodicidadePadrao: 10, statusCliente: "Ativo", enderecoEntrega: "Av. Anita Garibaldi, 1300 - Mont'Serrat, Porto Alegre - RS" },
  { nome: "REDEVIP24H (Bela Vista)", quantidadePadrao: 40, periodicidadePadrao: 10, statusCliente: "Ativo", enderecoEntrega: "R. Dr. Timóteo, 602 - Bela Vista, Porto Alegre - RS" },
  { nome: "REDEVIP24H (Bento/Intercap)", quantidadePadrao: 15, periodicidadePadrao: 10, statusCliente: "Ativo", enderecoEntrega: "Av. Bento Gonçalves, 8000 - Agronomia, Porto Alegre - RS" },
  { nome: "REDEVIP24H (Brino)", quantidadePadrao: 15, periodicidadePadrao: 14, statusCliente: "Ativo", enderecoEntrega: "Av. Otto Niemeyer, 2500 - Cavalhada, Porto Alegre - RS" },
  { nome: "REDEVIP24H (Carlos Gomes)", quantidadePadrao: 20, periodicidadePadrao: 10, statusCliente: "Ativo", enderecoEntrega: "Av. Carlos Gomes, 281 - Auxiliadora, Porto Alegre - RS" },
  { nome: "REDEVIP24H (Forte/Via Porto)", quantidadePadrao: 15, periodicidadePadrao: 10, statusCliente: "Ativo", enderecoEntrega: "Av. Mauá, 1050 - Centro Histórico, Porto Alegre - RS" },
  { nome: "REDEVIP24H (Moinhos)", quantidadePadrao: 15, periodicidadePadrao: 10, statusCliente: "Ativo", enderecoEntrega: "R. Dinarte Ribeiro, 50 - Moinhos de Vento, Porto Alegre - RS" },
  { nome: "REDEVIP24H (Painera)", quantidadePadrao: 20, periodicidadePadrao: 10, statusCliente: "Ativo", enderecoEntrega: "Av. Protásio Alves, 1090 - Alto Petrópolis, Porto Alegre - RS" },
  { nome: "REDEVIP24H (Planetário)", quantidadePadrao: 10, periodicidadePadrao: 14, statusCliente: "Ativo", enderecoEntrega: "Av. Ipiranga, 6000 - Partenon, Porto Alegre - RS" },
  { nome: "REDEVIP24H (Ramiro)", quantidadePadrao: 30, periodicidadePadrao: 10, statusCliente: "Ativo", enderecoEntrega: "R. Ramiro Barcelos, 1954 - Rio Branco, Porto Alegre - RS" },
  { nome: "Refugios Bar e Restaurante", quantidadePadrao: 15, periodicidadePadrao: 10, statusCliente: "Ativo", enderecoEntrega: "Av. Protásio Alves, 6999 - Alto Petrópolis, Porto Alegre - RS" },
  { nome: "Silva Lanches", quantidadePadrao: 10, periodicidadePadrao: 21, statusCliente: "Ativo", enderecoEntrega: "R. 24 de Outubro, 1222 - Moinhos de Vento, Porto Alegre - RS" },
  { nome: "Sirene Fish n Chips", quantidadePadrao: 15, periodicidadePadrao: 10, statusCliente: "Ativo", enderecoEntrega: "Av. Dr. Nilo Peçanha, 1851 - Três Figueiras, Porto Alegre - RS" },
  { nome: "Temperandus", quantidadePadrao: 10, periodicidadePadrao: 14, statusCliente: "Ativo", enderecoEntrega: "R. Padre Chagas, 400 - Moinhos de Vento, Porto Alegre - RS" },
  { nome: "The Brothers Distribuidora", quantidadePadrao: 0, periodicidadePadrao: 7, statusCliente: "Em análise", enderecoEntrega: "R. Padre Chagas, 342 - Moinhos de Vento, Porto Alegre - RS" },
  { nome: "Xirú Beer", quantidadePadrao: 8, periodicidadePadrao: 14, statusCliente: "Ativo", enderecoEntrega: "Av. Dr. Nilo Peçanha, 2000 - Boa Vista, Porto Alegre - RS" }
];

interface ClienteStore {
  clientes: Cliente[];
  clienteAtual: Cliente | null;
  filtros: {
    termo: string;
    status: StatusCliente | 'Todos';
  };
  
  // Ações
  setClientes: (clientes: Cliente[]) => void;
  adicionarCliente: (cliente: Omit<Cliente, 'id' | 'dataCadastro'>) => void;
  atualizarCliente: (id: number, dadosCliente: Partial<Cliente>) => void;
  removerCliente: (id: number) => void;
  selecionarCliente: (id: number | null) => void;
  setFiltroTermo: (termo: string) => void;
  setFiltroStatus: (status: StatusCliente | 'Todos') => void;
  setMetaGiro: (idCliente: number, metaSemanal: number) => void;
  
  // Getters
  getClientesFiltrados: () => Cliente[];
  getClientePorId: (id: number) => Cliente | undefined;
}

export const useClienteStore = create<ClienteStore>()(
  devtools(
    (set, get) => ({
      clientes: [
        ...clientesMock,
        ...clientesComDados.map((cliente, index) => ({
          id: 1000 + index,
          nome: cliente.nome || `Cliente ${1000 + index}`,
          cnpjCpf: `${Math.floor(Math.random() * 99)}.${Math.floor(Math.random() * 999)}.${Math.floor(Math.random() * 999)}/0001-${Math.floor(Math.random() * 99)}`,
          enderecoEntrega: cliente.enderecoEntrega || `Endereço do cliente ${1000 + index}`,
          contatoNome: `Contato ${1000 + index}`,
          contatoTelefone: `(51) 9${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`,
          contatoEmail: `contato@${cliente.nome?.toLowerCase().replace(/[^a-z0-9]/g, '')}.com.br`,
          quantidadePadrao: cliente.quantidadePadrao || 0,
          periodicidadePadrao: cliente.periodicidadePadrao || 7,
          statusCliente: cliente.statusCliente || "Ativo",
          dataCadastro: new Date(Date.now() - Math.floor(Math.random() * 10000000000)),
          metaGiroSemanal: Math.round((cliente.quantidadePadrao || 0) * 1.2), // Meta inicial: 20% acima do giro atual
          ultimaDataReposicaoEfetiva: new Date(Date.now() - Math.floor(Math.random() * 1000000000)),
          // Novos campos
          janelasEntrega: ['Seg', 'Qua', 'Sex'],
          representanteId: Math.ceil(Math.random() * 3),
          rotaEntregaId: Math.ceil(Math.random() * 3),
          categoriaEstabelecimentoId: Math.ceil(Math.random() * 6),
          instrucoesEntrega: Math.random() > 0.7 ? `Instruções de entrega para ${cliente.nome}` : undefined,
          contabilizarGiroMedio: Math.random() > 0.1, // 90% dos clientes contabilizam
          tipoLogistica: Math.random() > 0.3 ? 'Própria' : 'Distribuição',
          emiteNotaFiscal: Math.random() > 0.2,
          tipoCobranca: Math.random() > 0.5 ? 'À vista' : 'Consignado',
          formaPagamento: ['Boleto', 'PIX', 'Dinheiro'][Math.floor(Math.random() * 3)] as 'Boleto' | 'PIX' | 'Dinheiro',
          observacoes: Math.random() > 0.8 ? `Observações para ${cliente.nome}` : undefined
        }))
      ],
      clienteAtual: null,
      filtros: {
        termo: '',
        status: 'Todos'
      },
      
      setClientes: (clientes) => set({ clientes }),
      
      adicionarCliente: (cliente) => {
        const novoId = Math.max(0, ...get().clientes.map(c => c.id)) + 1;
        
        set(state => ({
          clientes: [
            ...state.clientes,
            {
              ...cliente,
              id: novoId,
              dataCadastro: new Date(),
              metaGiroSemanal: Math.round(calcularGiroSemanal(cliente.quantidadePadrao, cliente.periodicidadePadrao) * 1.2)
            }
          ]
        }));
      },
      
      atualizarCliente: (id, dadosCliente) => {
        set(state => ({
          clientes: state.clientes.map(cliente => 
            cliente.id === id ? { ...cliente, ...dadosCliente } : cliente
          ),
          clienteAtual: state.clienteAtual?.id === id ? { ...state.clienteAtual, ...dadosCliente } : state.clienteAtual
        }));
      },
      
      removerCliente: (id) => {
        set(state => ({
          clientes: state.clientes.filter(cliente => cliente.id !== id),
          clienteAtual: state.clienteAtual?.id === id ? null : state.clienteAtual
        }));
      },
      
      selecionarCliente: (id) => {
        if (id === null) {
          set({ clienteAtual: null });
          return;
        }
        
        const cliente = get().clientes.find(c => c.id === id);
        set({ clienteAtual: cliente || null });
      },
      
      setFiltroTermo: (termo) => {
        set(state => ({
          filtros: {
            ...state.filtros,
            termo
          }
        }));
      },
      
      setFiltroStatus: (status) => {
        set(state => ({
          filtros: {
            ...state.filtros,
            status
          }
        }));
      },
      
      setMetaGiro: (idCliente, metaSemanal) => {
        set(state => ({
          clientes: state.clientes.map(cliente => 
            cliente.id === idCliente ? { ...cliente, metaGiroSemanal: metaSemanal } : cliente
          ),
          clienteAtual: state.clienteAtual?.id === idCliente ? { ...state.clienteAtual, metaGiroSemanal: metaSemanal } : state.clienteAtual
        }));
      },
      
      getClientesFiltrados: () => {
        const { clientes, filtros } = get();
        
        return clientes.filter(cliente => {
          // Filtro por termo
          const termoMatch = filtros.termo === '' || 
            cliente.nome.toLowerCase().includes(filtros.termo.toLowerCase()) ||
            (cliente.cnpjCpf && cliente.cnpjCpf.includes(filtros.termo));
          
          // Filtro por status
          const statusMatch = filtros.status === 'Todos' || cliente.statusCliente === filtros.status;
          
          return termoMatch && statusMatch;
        });
      },
      
      getClientePorId: (id) => {
        return get().clientes.find(c => c.id === id);
      }
    }),
    { name: 'cliente-store' }
  )
);

// Helper para calcular giro semanal
function calcularGiroSemanal(qtdPadrao: number, periodicidadeDias: number): number {
  // Para periodicidade em dias, converter para semanas
  if (periodicidadeDias === 3) {
    // Caso especial: 3x por semana
    return qtdPadrao * 3;
  }
  
  // Para outros casos, calcular giro semanal
  const periodicidadeSemanas = periodicidadeDias / 7;
  return Math.round(qtdPadrao / periodicidadeSemanas);
}
