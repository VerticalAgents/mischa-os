
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { toast } from "@/hooks/use-toast";
import { 
  Insumo, 
  Fornecedor, 
  Cotacao, 
  PedidoCompra, 
  MovimentacaoEstoque,
  ItemCotacao,
  PropostaFornecedor
} from '@/types/insumos';

// Mock data for initial state
const insumosMock: Insumo[] = [
  {
    id: 1,
    nome: "Chocolate Meio Amargo",
    categoria: "Matéria Prima",
    volumeBruto: 1000,
    unidadeMedida: "g",
    custoMedio: 30.00,
    custoUnitario: 0.03, // 30.00 / 1000
    estoqueAtual: 3500,
    estoqueMinimo: 2000,
    ultimaEntrada: new Date('2025-05-15'),
  },
  {
    id: 2,
    nome: "Manteiga",
    categoria: "Matéria Prima",
    volumeBruto: 200,
    unidadeMedida: "g",
    custoMedio: 8.50,
    custoUnitario: 0.0425, // 8.50 / 200
    estoqueAtual: 1200,
    estoqueMinimo: 800,
    ultimaEntrada: new Date('2025-05-10'),
  },
  {
    id: 3,
    nome: "Açúcar",
    categoria: "Matéria Prima",
    volumeBruto: 1000,
    unidadeMedida: "g",
    custoMedio: 6.00,
    custoUnitario: 0.006, // 6.00 / 1000
    estoqueAtual: 5000,
    estoqueMinimo: 3000,
    ultimaEntrada: new Date('2025-05-12'),
  },
  {
    id: 4,
    nome: "Farinha de Trigo",
    categoria: "Matéria Prima",
    volumeBruto: 1000,
    unidadeMedida: "g",
    custoMedio: 4.50,
    custoUnitario: 0.0045, // 4.50 / 1000
    estoqueAtual: 3800,
    estoqueMinimo: 2000,
    ultimaEntrada: new Date('2025-05-14'),
  },
  {
    id: 5,
    nome: "Embalagem Plástica Individual",
    categoria: "Embalagem",
    volumeBruto: 100,
    unidadeMedida: "un",
    custoMedio: 25.00,
    custoUnitario: 0.25, // 25.00 / 100
    estoqueAtual: 450,
    estoqueMinimo: 300,
    ultimaEntrada: new Date('2025-05-05'),
  },
  {
    id: 6,
    nome: "Rótulo de Papel",
    categoria: "Embalagem",
    volumeBruto: 100,
    unidadeMedida: "un",
    custoMedio: 10.00,
    custoUnitario: 0.10, // 10.00 / 100
    estoqueAtual: 580,
    estoqueMinimo: 400,
    ultimaEntrada: new Date('2025-05-08'),
  }
];

const fornecedoresMock: Fornecedor[] = [
  {
    id: 1,
    nome: "Distribuidora de Chocolates Fino",
    contato: "Ana Silva",
    email: "ana@chocolatesfino.com",
    telefone: "(11) 98765-4321"
  },
  {
    id: 2,
    nome: "Adega Alimentos Ltda.",
    contato: "Carlos Pereira",
    email: "carlos@adegaalimentos.com",
    telefone: "(11) 91234-5678" 
  },
  {
    id: 3,
    nome: "Embalagens Premium",
    contato: "Marcia Santos",
    email: "marcia@embalagempremium.com",
    telefone: "(11) 92345-6789"
  }
];

const cotacoesMock: Cotacao[] = [
  {
    id: 1,
    titulo: "Cotação de Insumos - Maio/2025",
    dataCriacao: new Date('2025-05-01'),
    dataValidade: new Date('2025-05-10'),
    status: "Finalizada",
    itens: [
      { id: 1, insumoId: 1, quantidade: 5000 },
      { id: 2, insumoId: 3, quantidade: 10000 }
    ],
    propostas: [
      {
        id: 1,
        cotacaoId: 1,
        fornecedorId: 1,
        itens: [
          { itemId: 1, precoUnitario: 0.028 },
          { itemId: 2, precoUnitario: 0.0055 }
        ],
        prazoEntrega: 3,
        frete: 25.0,
        formaPagamento: "À vista"
      },
      {
        id: 2,
        cotacaoId: 1,
        fornecedorId: 2,
        itens: [
          { itemId: 1, precoUnitario: 0.030 },
          { itemId: 2, precoUnitario: 0.0052 }
        ],
        prazoEntrega: 5,
        frete: 0.0,
        formaPagamento: "30 dias"
      }
    ],
    propostaVencedoraId: 1
  }
];

const pedidosMock: PedidoCompra[] = [
  {
    id: 1,
    cotacaoId: 1,
    fornecedorId: 1,
    dataCriacao: new Date('2025-05-08'),
    dataEntregaPrevista: new Date('2025-05-11'),
    itens: [
      { insumoId: 1, quantidade: 5000, precoUnitario: 0.028 },
      { insumoId: 3, quantidade: 10000, precoUnitario: 0.0055 }
    ],
    valorTotal: 5000 * 0.028 + 10000 * 0.0055 + 25.0, // Chocolate + Açúcar + Frete
    status: "Recebido",
    observacoes: "Pedido recebido em perfeitas condições."
  }
];

const movimentacoesMock: MovimentacaoEstoque[] = [
  {
    id: 1,
    insumoId: 1,
    tipo: "entrada",
    quantidade: 5000,
    data: new Date('2025-05-11'),
    usuario: "Carlos Oliveira",
    observacao: "Entrada via pedido de compra #1",
    pedidoCompraId: 1
  },
  {
    id: 2,
    insumoId: 3,
    tipo: "entrada",
    quantidade: 10000,
    data: new Date('2025-05-11'),
    usuario: "Carlos Oliveira",
    observacao: "Entrada via pedido de compra #1",
    pedidoCompraId: 1
  },
  {
    id: 3,
    insumoId: 1,
    tipo: "saida",
    quantidade: 1500,
    data: new Date('2025-05-13'),
    usuario: "Maria Souza",
    observacao: "Saída para produção - Lote #345"
  }
];

interface InsumosStore {
  // Estado
  insumos: Insumo[];
  fornecedores: Fornecedor[];
  cotacoes: Cotacao[];
  pedidosCompra: PedidoCompra[];
  movimentacoesEstoque: MovimentacaoEstoque[];
  
  // Insumos
  adicionarInsumo: (insumo: Omit<Insumo, 'id' | 'custoUnitario'>) => void;
  atualizarInsumo: (id: number, dados: Partial<Omit<Insumo, 'id' | 'custoUnitario'>>) => void;
  removerInsumo: (id: number) => void;
  
  // Fornecedores
  adicionarFornecedor: (fornecedor: Omit<Fornecedor, 'id'>) => void;
  atualizarFornecedor: (id: number, dados: Partial<Omit<Fornecedor, 'id'>>) => void;
  removerFornecedor: (id: number) => void;
  
  // Cotações
  criarCotacao: (cotacao: Omit<Cotacao, 'id' | 'dataCriacao' | 'propostas'>) => number;
  adicionarItemCotacao: (cotacaoId: number, item: Omit<ItemCotacao, 'id'>) => void;
  removerItemCotacao: (cotacaoId: number, itemId: number) => void;
  adicionarPropostaFornecedor: (proposta: Omit<PropostaFornecedor, 'id'>) => void;
  escolherPropostaVencedora: (cotacaoId: number, propostaId: number) => void;
  atualizarStatusCotacao: (id: number, status: Cotacao['status']) => void;
  gerarPedidoCompraDeCotacao: (cotacaoId: number) => number;
  
  // Pedidos de Compra
  criarPedidoCompra: (pedido: Omit<PedidoCompra, 'id' | 'dataCriacao'>) => number;
  atualizarStatusPedido: (id: number, status: PedidoCompra['status']) => void;
  receberPedido: (id: number) => void;
  
  // Movimentações de estoque
  registrarMovimentacao: (movimentacao: Omit<MovimentacaoEstoque, 'id' | 'data'>) => void;
  
  // Getters
  obterEstoqueAtual: (insumoId: number) => number;
  obterMovimentacoesInsumo: (insumoId: number) => MovimentacaoEstoque[];
  obterInsumo: (id: number) => Insumo | undefined;
  obterFornecedor: (id: number) => Fornecedor | undefined;
}

export const useInsumosStore = create<InsumosStore>()(
  devtools(
    (set, get) => ({
      // Estado inicial
      insumos: insumosMock,
      fornecedores: fornecedoresMock,
      cotacoes: cotacoesMock,
      pedidosCompra: pedidosMock,
      movimentacoesEstoque: movimentacoesMock,
      
      // Insumos
      adicionarInsumo: (insumo) => {
        const novoId = Math.max(0, ...get().insumos.map(i => i.id)) + 1;
        const custoUnitario = insumo.volumeBruto > 0 ? insumo.custoMedio / insumo.volumeBruto : 0;
        
        const novoInsumo: Insumo = {
          ...insumo,
          id: novoId,
          custoUnitario: Number(custoUnitario.toFixed(4))
        };
        
        set(state => ({
          insumos: [...state.insumos, novoInsumo]
        }));
        
        toast({ 
          title: "Insumo adicionado",
          description: `O insumo ${insumo.nome} foi adicionado com sucesso!`
        });
      },
      
      atualizarInsumo: (id, dados) => {
        const insumo = get().insumos.find(i => i.id === id);
        
        if (!insumo) {
          toast({
            title: "Erro",
            description: "Insumo não encontrado",
            variant: "destructive"
          });
          return;
        }
        
        // Recalcular custoUnitario se necessário
        const volumeBruto = dados.volumeBruto !== undefined ? dados.volumeBruto : insumo.volumeBruto;
        const custoMedio = dados.custoMedio !== undefined ? dados.custoMedio : insumo.custoMedio;
        const custoUnitario = volumeBruto > 0 ? custoMedio / volumeBruto : 0;
        
        set(state => ({
          insumos: state.insumos.map(i => 
            i.id === id 
              ? { 
                  ...i, 
                  ...dados,
                  custoUnitario: Number(custoUnitario.toFixed(4))
                }
              : i
          )
        }));
        
        toast({
          title: "Insumo atualizado",
          description: `O insumo ${insumo.nome} foi atualizado com sucesso!`
        });
      },
      
      removerInsumo: (id) => {
        const insumo = get().insumos.find(i => i.id === id);
        
        if (!insumo) {
          toast({
            title: "Erro",
            description: "Insumo não encontrado",
            variant: "destructive"
          });
          return;
        }
        
        // Verificar se há movimentações ou cotações usando este insumo
        const temMovimentacoes = get().movimentacoesEstoque.some(m => m.insumoId === id);
        const temEmCotacoes = get().cotacoes.some(c => 
          c.itens.some(i => i.insumoId === id)
        );
        
        if (temMovimentacoes || temEmCotacoes) {
          toast({
            title: "Não é possível remover",
            description: "Este insumo possui movimentações ou está em cotações",
            variant: "destructive"
          });
          return;
        }
        
        set(state => ({
          insumos: state.insumos.filter(i => i.id !== id)
        }));
        
        toast({
          title: "Insumo removido",
          description: `O insumo ${insumo.nome} foi removido com sucesso!`
        });
      },
      
      // Fornecedores
      adicionarFornecedor: (fornecedor) => {
        const novoId = Math.max(0, ...get().fornecedores.map(f => f.id)) + 1;
        
        set(state => ({
          fornecedores: [...state.fornecedores, { ...fornecedor, id: novoId }]
        }));
        
        toast({
          title: "Fornecedor adicionado",
          description: `O fornecedor ${fornecedor.nome} foi adicionado com sucesso!`
        });
      },
      
      atualizarFornecedor: (id, dados) => {
        const fornecedor = get().fornecedores.find(f => f.id === id);
        
        if (!fornecedor) {
          toast({
            title: "Erro",
            description: "Fornecedor não encontrado",
            variant: "destructive"
          });
          return;
        }
        
        set(state => ({
          fornecedores: state.fornecedores.map(f => 
            f.id === id ? { ...f, ...dados } : f
          )
        }));
        
        toast({
          title: "Fornecedor atualizado",
          description: `O fornecedor ${fornecedor.nome} foi atualizado com sucesso!`
        });
      },
      
      removerFornecedor: (id) => {
        const fornecedor = get().fornecedores.find(f => f.id === id);
        
        if (!fornecedor) {
          toast({
            title: "Erro",
            description: "Fornecedor não encontrado",
            variant: "destructive"
          });
          return;
        }
        
        // Verificar se existe algum pedido ou proposta associado a este fornecedor
        const temPedidos = get().pedidosCompra.some(p => p.fornecedorId === id);
        const temPropostas = get().cotacoes.some(c => 
          c.propostas.some(p => p.fornecedorId === id)
        );
        
        if (temPedidos || temPropostas) {
          toast({
            title: "Não é possível remover",
            description: "Este fornecedor possui pedidos ou propostas associadas",
            variant: "destructive"
          });
          return;
        }
        
        set(state => ({
          fornecedores: state.fornecedores.filter(f => f.id !== id)
        }));
        
        toast({
          title: "Fornecedor removido",
          description: `O fornecedor ${fornecedor.nome} foi removido com sucesso!`
        });
      },
      
      // Cotações
      criarCotacao: (cotacao) => {
        const novoId = Math.max(0, ...get().cotacoes.map(c => c.id)) + 1;
        
        const novaCotacao: Cotacao = {
          ...cotacao,
          id: novoId,
          dataCriacao: new Date(),
          propostas: []
        };
        
        set(state => ({
          cotacoes: [...state.cotacoes, novaCotacao]
        }));
        
        toast({
          title: "Cotação criada",
          description: `A cotação ${cotacao.titulo} foi criada com sucesso!`
        });
        
        return novoId;
      },
      
      adicionarItemCotacao: (cotacaoId, item) => {
        const cotacaoIndex = get().cotacoes.findIndex(c => c.id === cotacaoId);
        
        if (cotacaoIndex === -1) {
          toast({
            title: "Erro",
            description: "Cotação não encontrada",
            variant: "destructive"
          });
          return;
        }
        
        const novoId = Math.max(0, ...get().cotacoes[cotacaoIndex].itens.map(i => i.id)) + 1;
        
        set(state => {
          const cotacoesAtualizadas = [...state.cotacoes];
          cotacoesAtualizadas[cotacaoIndex].itens.push({ ...item, id: novoId });
          
          return { cotacoes: cotacoesAtualizadas };
        });
      },
      
      removerItemCotacao: (cotacaoId, itemId) => {
        const cotacaoIndex = get().cotacoes.findIndex(c => c.id === cotacaoId);
        
        if (cotacaoIndex === -1) {
          toast({
            title: "Erro",
            description: "Cotação não encontrada",
            variant: "destructive"
          });
          return;
        }
        
        set(state => {
          const cotacoesAtualizadas = [...state.cotacoes];
          cotacoesAtualizadas[cotacaoIndex].itens = 
            cotacoesAtualizadas[cotacaoIndex].itens.filter(i => i.id !== itemId);
          
          return { cotacoes: cotacoesAtualizadas };
        });
      },
      
      adicionarPropostaFornecedor: (proposta) => {
        const cotacaoIndex = get().cotacoes.findIndex(c => c.id === proposta.cotacaoId);
        
        if (cotacaoIndex === -1) {
          toast({
            title: "Erro",
            description: "Cotação não encontrada",
            variant: "destructive"
          });
          return;
        }
        
        const novoId = Math.max(
          0, 
          ...get().cotacoes[cotacaoIndex].propostas.map(p => p.id)
        ) + 1;
        
        set(state => {
          const cotacoesAtualizadas = [...state.cotacoes];
          cotacoesAtualizadas[cotacaoIndex].propostas.push({ ...proposta, id: novoId });
          
          return { cotacoes: cotacoesAtualizadas };
        });
        
        toast({
          title: "Proposta adicionada",
          description: `Nova proposta adicionada com sucesso!`
        });
      },
      
      escolherPropostaVencedora: (cotacaoId, propostaId) => {
        const cotacaoIndex = get().cotacoes.findIndex(c => c.id === cotacaoId);
        
        if (cotacaoIndex === -1) {
          toast({
            title: "Erro",
            description: "Cotação não encontrada",
            variant: "destructive"
          });
          return;
        }
        
        set(state => {
          const cotacoesAtualizadas = [...state.cotacoes];
          cotacoesAtualizadas[cotacaoIndex].propostaVencedoraId = propostaId;
          cotacoesAtualizadas[cotacaoIndex].status = "Finalizada";
          
          return { cotacoes: cotacoesAtualizadas };
        });
        
        toast({
          title: "Proposta escolhida",
          description: `Proposta vencedora definida com sucesso!`
        });
      },
      
      atualizarStatusCotacao: (id, status) => {
        const cotacaoIndex = get().cotacoes.findIndex(c => c.id === id);
        
        if (cotacaoIndex === -1) {
          toast({
            title: "Erro",
            description: "Cotação não encontrada",
            variant: "destructive"
          });
          return;
        }
        
        set(state => {
          const cotacoesAtualizadas = [...state.cotacoes];
          cotacoesAtualizadas[cotacaoIndex].status = status;
          
          return { cotacoes: cotacoesAtualizadas };
        });
        
        toast({
          title: "Status atualizado",
          description: `O status da cotação foi atualizado para ${status}`
        });
      },
      
      gerarPedidoCompraDeCotacao: (cotacaoId) => {
        const cotacao = get().cotacoes.find(c => c.id === cotacaoId);
        
        if (!cotacao) {
          toast({
            title: "Erro",
            description: "Cotação não encontrada",
            variant: "destructive"
          });
          return -1;
        }
        
        if (!cotacao.propostaVencedoraId) {
          toast({
            title: "Erro",
            description: "Não há proposta vencedora definida",
            variant: "destructive"
          });
          return -1;
        }
        
        const proposta = cotacao.propostas.find(p => p.id === cotacao.propostaVencedoraId);
        
        if (!proposta) {
          toast({
            title: "Erro",
            description: "Proposta vencedora não encontrada",
            variant: "destructive"
          });
          return -1;
        }
        
        const itens = cotacao.itens.map(item => {
          const propostaItem = proposta.itens.find(i => i.itemId === item.id);
          const precoUnitario = propostaItem ? propostaItem.precoUnitario : 0;
          
          return {
            insumoId: item.insumoId,
            quantidade: item.quantidade,
            precoUnitario
          };
        });
        
        const valorTotal = itens.reduce(
          (soma, item) => soma + item.quantidade * item.precoUnitario,
          proposta.frete || 0
        );
        
        const dataEntregaPrevista = new Date();
        dataEntregaPrevista.setDate(dataEntregaPrevista.getDate() + proposta.prazoEntrega);
        
        const pedido: Omit<PedidoCompra, 'id' | 'dataCriacao'> = {
          cotacaoId,
          fornecedorId: proposta.fornecedorId,
          dataEntregaPrevista,
          itens,
          valorTotal,
          status: "Pendente",
          observacoes: `Gerado a partir da cotação #${cotacaoId}`
        };
        
        return get().criarPedidoCompra(pedido);
      },
      
      // Pedidos de Compra
      criarPedidoCompra: (pedido) => {
        const novoId = Math.max(0, ...get().pedidosCompra.map(p => p.id)) + 1;
        
        const novoPedido: PedidoCompra = {
          ...pedido,
          id: novoId,
          dataCriacao: new Date()
        };
        
        set(state => ({
          pedidosCompra: [...state.pedidosCompra, novoPedido]
        }));
        
        toast({
          title: "Pedido criado",
          description: `Pedido de compra #${novoId} criado com sucesso!`
        });
        
        return novoId;
      },
      
      atualizarStatusPedido: (id, status) => {
        const pedidoIndex = get().pedidosCompra.findIndex(p => p.id === id);
        
        if (pedidoIndex === -1) {
          toast({
            title: "Erro",
            description: "Pedido não encontrado",
            variant: "destructive"
          });
          return;
        }
        
        set(state => {
          const pedidosAtualizados = [...state.pedidosCompra];
          pedidosAtualizados[pedidoIndex].status = status;
          
          return { pedidosCompra: pedidosAtualizados };
        });
        
        toast({
          title: "Status atualizado",
          description: `O status do pedido foi atualizado para ${status}`
        });
      },
      
      receberPedido: (id) => {
        const pedido = get().pedidosCompra.find(p => p.id === id);
        
        if (!pedido) {
          toast({
            title: "Erro",
            description: "Pedido não encontrado",
            variant: "destructive"
          });
          return;
        }
        
        if (pedido.status === "Recebido") {
          toast({
            title: "Aviso",
            description: "Este pedido já foi recebido anteriormente"
          });
          return;
        }
        
        // Atualiza o status do pedido
        get().atualizarStatusPedido(id, "Recebido");
        
        // Registra as entradas no estoque para cada item
        pedido.itens.forEach(item => {
          const movimentacao: Omit<MovimentacaoEstoque, "id" | "data"> = {
            insumoId: item.insumoId,
            tipo: "entrada",
            quantidade: item.quantidade,
            usuario: "Usuário Atual", // Idealmente, pegaria o usuário logado
            observacao: `Entrada via pedido de compra #${pedido.id}`,
            pedidoCompraId: pedido.id
          };
          
          get().registrarMovimentacao(movimentacao);
          
          // Atualiza o custo médio do insumo baseado no novo preço
          const insumo = get().insumos.find(i => i.id === item.insumoId);
          
          if (insumo) {
            const estoqueAtual = insumo.estoqueAtual || 0;
            const custoEstoqueAtual = estoqueAtual * insumo.custoMedio;
            const custoNovaEntrada = item.quantidade * item.precoUnitario;
            const novoEstoqueTotal = estoqueAtual + item.quantidade;
            const novoCustoMedio = novoEstoqueTotal > 0 
              ? (custoEstoqueAtual + custoNovaEntrada) / novoEstoqueTotal
              : insumo.custoMedio;
            
            get().atualizarInsumo(item.insumoId, {
              custoMedio: Number(novoCustoMedio.toFixed(2)),
              ultimaEntrada: new Date()
            });
          }
        });
        
        toast({
          title: "Pedido recebido",
          description: `O pedido #${id} foi recebido e o estoque foi atualizado!`
        });
      },
      
      // Movimentações de estoque
      registrarMovimentacao: (movimentacao) => {
        const novoId = Math.max(0, ...get().movimentacoesEstoque.map(m => m.id)) + 1;
        
        const novaMovimentacao: MovimentacaoEstoque = {
          ...movimentacao,
          id: novoId,
          data: new Date()
        };
        
        set(state => ({
          movimentacoesEstoque: [...state.movimentacoesEstoque, novaMovimentacao]
        }));
        
        // Atualiza o estoque atual do insumo
        const insumo = get().insumos.find(i => i.id === movimentacao.insumoId);
        
        if (insumo) {
          const estoqueAtual = insumo.estoqueAtual || 0;
          const novoEstoque = movimentacao.tipo === "entrada"
            ? estoqueAtual + movimentacao.quantidade
            : Math.max(0, estoqueAtual - movimentacao.quantidade);
          
          get().atualizarInsumo(movimentacao.insumoId, { 
            estoqueAtual: novoEstoque,
            ultimaEntrada: movimentacao.tipo === "entrada" ? new Date() : insumo.ultimaEntrada
          });
        }
      },
      
      // Getters
      obterEstoqueAtual: (insumoId) => {
        const insumo = get().insumos.find(i => i.id === insumoId);
        return insumo?.estoqueAtual || 0;
      },
      
      obterMovimentacoesInsumo: (insumoId) => {
        return get().movimentacoesEstoque.filter(m => m.insumoId === insumoId);
      },
      
      obterInsumo: (id) => {
        return get().insumos.find(i => i.id === id);
      },
      
      obterFornecedor: (id) => {
        return get().fornecedores.find(f => f.id === id);
      }
    }),
    { name: 'insumos-store' }
  )
);
