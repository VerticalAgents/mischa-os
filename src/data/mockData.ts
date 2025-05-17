import { 
  Cliente, 
  Sabor, 
  Pedido, 
  ItemPedido,
  Alerta
} from '../types';

// Clientes (PDVs) mockados
export const clientesMock: Cliente[] = [
  {
    id: 1,
    nome: "Café Central",
    cnpjCpf: "12.345.678/0001-90",
    enderecoEntrega: "Rua Central, 123",
    contatoNome: "João Silva",
    contatoTelefone: "(11) 98765-4321",
    contatoEmail: "joao@cafecentral.com",
    quantidadePadrao: 100,
    periodicidadePadrao: 7,
    statusCliente: "Ativo",
    dataCadastro: new Date("2023-01-15"),
    ultimaDataReposicaoEfetiva: new Date("2024-05-07")
  },
  {
    id: 2,
    nome: "Padaria Bom Pão",
    cnpjCpf: "23.456.789/0001-01",
    enderecoEntrega: "Av. Paes, 456",
    contatoNome: "Maria Oliveira",
    contatoTelefone: "(11) 91234-5678",
    contatoEmail: "maria@bompao.com",
    quantidadePadrao: 80,
    periodicidadePadrao: 5,
    statusCliente: "Ativo",
    dataCadastro: new Date("2023-02-20"),
    ultimaDataReposicaoEfetiva: new Date("2024-05-09")
  },
  {
    id: 3,
    nome: "Empório da Esquina",
    cnpjCpf: "34.567.890/0001-12",
    enderecoEntrega: "Rua da Esquina, 789",
    contatoNome: "Pedro Santos",
    contatoTelefone: "(11) 94321-8765",
    contatoEmail: "pedro@emporio.com",
    quantidadePadrao: 60,
    periodicidadePadrao: 7,
    statusCliente: "Ativo",
    dataCadastro: new Date("2023-03-10"),
    ultimaDataReposicaoEfetiva: new Date("2024-05-08")
  },
  {
    id: 4,
    nome: "Café Novo Horizonte",
    cnpjCpf: "45.678.901/0001-23",
    enderecoEntrega: "Av. Horizonte, 234",
    contatoNome: "Ana Souza",
    contatoTelefone: "(11) 98765-1234",
    contatoEmail: "ana@novohorizonte.com",
    quantidadePadrao: 50,
    periodicidadePadrao: 5,
    statusCliente: "Em análise",
    dataCadastro: new Date("2024-04-05")
  },
  {
    id: 5,
    nome: "Supermercado Compre Mais",
    cnpjCpf: "56.789.012/0001-34",
    enderecoEntrega: "Rua das Compras, 567",
    contatoNome: "Carlos Lima",
    contatoTelefone: "(11) 91234-8765",
    contatoEmail: "carlos@compremais.com",
    quantidadePadrao: 120,
    periodicidadePadrao: 7,
    statusCliente: "Standby",
    dataCadastro: new Date("2023-05-15"),
    ultimaDataReposicaoEfetiva: new Date("2024-04-25")
  },
  {
    id: 6,
    nome: "Delícias da Vovó",
    cnpjCpf: "67.890.123/0001-45",
    enderecoEntrega: "Rua das Delícias, 890",
    contatoNome: "Laura Costa",
    contatoTelefone: "(11) 94321-5678",
    contatoEmail: "laura@delicias.com",
    quantidadePadrao: 40,
    periodicidadePadrao: 3,
    statusCliente: "A ativar",
    dataCadastro: new Date("2024-05-01")
  },
  {
    id: 7,
    nome: "Mercado Bairro Feliz",
    cnpjCpf: "78.901.234/0001-56",
    enderecoEntrega: "Av. do Bairro, 123",
    contatoNome: "Rafael Alves",
    contatoTelefone: "(11) 98765-4321",
    contatoEmail: "rafael@bairrofeliz.com",
    quantidadePadrao: 90,
    periodicidadePadrao: 7,
    statusCliente: "Inativo",
    dataCadastro: new Date("2023-06-25"),
    ultimaDataReposicaoEfetiva: new Date("2024-03-15")
  }
];

// Sabores mockados com todos os campos obrigatórios
export const saboresMock: Sabor[] = [
  {
    id: 1,
    nome: "Tradicional",
    percentualPadraoDist: 18,
    ativo: true,
    estoqueMinimo: 30,
    saldoAtual: 45,
    // Adicionando campos obrigatórios faltantes
    custoUnitario: 2.50,
    precoVenda: 5.00,
    estoqueIdeal: 50,
    emProducao: 0
  },
  {
    id: 2,
    nome: "Choco Duo",
    percentualPadraoDist: 28,
    ativo: true,
    estoqueMinimo: 50,
    saldoAtual: 38,
    custoUnitario: 3.00,
    precoVenda: 5.50,
    estoqueIdeal: 60,
    emProducao: 0
  },
  {
    id: 3,
    nome: "Meio Amargo",
    percentualPadraoDist: 13,
    ativo: true,
    estoqueMinimo: 25,
    saldoAtual: 30,
    custoUnitario: 2.75,
    precoVenda: 5.25,
    estoqueIdeal: 40,
    emProducao: 0
  },
  {
    id: 4,
    nome: "Stikadinho",
    percentualPadraoDist: 20,
    ativo: true,
    estoqueMinimo: 40,
    saldoAtual: 55,
    custoUnitario: 2.90,
    precoVenda: 5.40,
    estoqueIdeal: 60,
    emProducao: 0
  },
  {
    id: 5,
    nome: "Avelã",
    percentualPadraoDist: 20,
    ativo: true,
    estoqueMinimo: 40,
    saldoAtual: 22,
    custoUnitario: 3.50,
    precoVenda: 6.00,
    estoqueIdeal: 50,
    emProducao: 0
  },
  {
    id: 6,
    nome: "Blondie",
    percentualPadraoDist: 0,
    ativo: true,
    estoqueMinimo: 15,
    saldoAtual: 12,
    custoUnitario: 3.20,
    precoVenda: 5.80,
    estoqueIdeal: 30,
    emProducao: 0
  },
  {
    id: 7,
    nome: "Doce de Leite",
    percentualPadraoDist: 1,
    ativo: true,
    estoqueMinimo: 15,
    saldoAtual: 18,
    custoUnitario: 2.80,
    precoVenda: 5.30,
    estoqueIdeal: 30,
    emProducao: 0
  },
  {
    id: 8,
    nome: "Nesquik",
    percentualPadraoDist: 0,
    ativo: true,
    estoqueMinimo: 15,
    saldoAtual: 10,
    custoUnitario: 2.60,
    precoVenda: 5.20,
    estoqueIdeal: 25,
    emProducao: 0
  },
  {
    id: 9,
    nome: "Oreo Cream",
    percentualPadraoDist: 0,
    ativo: true,
    estoqueMinimo: 15,
    saldoAtual: 25,
    custoUnitario: 3.30,
    precoVenda: 5.90,
    estoqueIdeal: 35,
    emProducao: 0
  },
  {
    id: 10,
    nome: "Pistache",
    percentualPadraoDist: 0,
    ativo: true,
    estoqueMinimo: 10,
    saldoAtual: 8,
    custoUnitario: 4.00,
    precoVenda: 7.00,
    estoqueIdeal: 20,
    emProducao: 0
  }
];

// Pedidos mockados
export const pedidosMock: Pedido[] = [
  {
    id: 1,
    idCliente: 1,
    dataPedido: new Date("2024-05-10"),
    dataPrevistaEntrega: new Date("2024-05-14"),
    totalPedidoUnidades: 100,
    tipoPedido: "Padrão",
    statusPedido: "Agendado",
    observacoes: "Entrega antes das 10h",
    itensPedido: []
  },
  {
    id: 2,
    idCliente: 2,
    dataPedido: new Date("2024-05-11"),
    dataPrevistaEntrega: new Date("2024-05-14"),
    totalPedidoUnidades: 80,
    tipoPedido: "Alterado",
    statusPedido: "Agendado",
    observacoes: "Cliente pediu mais Avelã e menos Tradicional",
    itensPedido: []
  },
  {
    id: 3,
    idCliente: 3,
    dataPedido: new Date("2024-05-09"),
    dataPrevistaEntrega: new Date("2024-05-15"),
    totalPedidoUnidades: 60,
    tipoPedido: "Padrão",
    statusPedido: "Agendado",
    itensPedido: []
  },
  {
    id: 4,
    idCliente: 1,
    dataPedido: new Date("2024-05-03"),
    dataPrevistaEntrega: new Date("2024-05-07"),
    totalPedidoUnidades: 100,
    tipoPedido: "Padrão",
    statusPedido: "Entregue",
    dataEfetivaEntrega: new Date("2024-05-07"),
    itensPedido: []
  },
  {
    id: 5,
    idCliente: 2,
    dataPedido: new Date("2024-05-04"),
    dataPrevistaEntrega: new Date("2024-05-09"),
    totalPedidoUnidades: 80,
    tipoPedido: "Padrão",
    statusPedido: "Entregue",
    dataEfetivaEntrega: new Date("2024-05-09"),
    itensPedido: []
  }
];

// Itens de pedido mockados com nomeSabor adicionado
export const itensPedidoMock: ItemPedido[] = [
  // Pedido 1 (Padrão para Café Central)
  { id: 1, idPedido: 1, idSabor: 1, nomeSabor: "Tradicional", quantidadeSabor: 18 },
  { id: 2, idPedido: 1, idSabor: 2, nomeSabor: "Choco Duo", quantidadeSabor: 28 },
  { id: 3, idPedido: 1, idSabor: 3, nomeSabor: "Meio Amargo", quantidadeSabor: 13 },
  { id: 4, idPedido: 1, idSabor: 4, nomeSabor: "Stikadinho", quantidadeSabor: 20 },
  { id: 5, idPedido: 1, idSabor: 5, nomeSabor: "Avelã", quantidadeSabor: 21 },
  
  // Pedido 2 (Alterado para Bom Pão)
  { id: 6, idPedido: 2, idSabor: 1, nomeSabor: "Tradicional", quantidadeSabor: 10 },
  { id: 7, idPedido: 2, idSabor: 2, nomeSabor: "Choco Duo", quantidadeSabor: 20 },
  { id: 8, idPedido: 2, idSabor: 3, nomeSabor: "Meio Amargo", quantidadeSabor: 10 },
  { id: 9, idPedido: 2, idSabor: 4, nomeSabor: "Stikadinho", quantidadeSabor: 15 },
  { id: 10, idPedido: 2, idSabor: 5, nomeSabor: "Avelã", quantidadeSabor: 25 },
  
  // Pedido 3 (Padrão para Empório)
  { id: 11, idPedido: 3, idSabor: 1, nomeSabor: "Tradicional", quantidadeSabor: 11 },
  { id: 12, idPedido: 3, idSabor: 2, nomeSabor: "Choco Duo", quantidadeSabor: 17 },
  { id: 13, idPedido: 3, idSabor: 3, nomeSabor: "Meio Amargo", quantidadeSabor: 8 },
  { id: 14, idPedido: 3, idSabor: 4, nomeSabor: "Stikadinho", quantidadeSabor: 12 },
  { id: 15, idPedido: 3, idSabor: 5, nomeSabor: "Avelã", quantidadeSabor: 12 },
  
  // Pedido 4 (Entregue para Café Central)
  { id: 16, idPedido: 4, idSabor: 1, nomeSabor: "Tradicional", quantidadeSabor: 18, quantidadeEntregue: 18 },
  { id: 17, idPedido: 4, idSabor: 2, nomeSabor: "Choco Duo", quantidadeSabor: 28, quantidadeEntregue: 28 },
  { id: 18, idPedido: 4, idSabor: 3, nomeSabor: "Meio Amargo", quantidadeSabor: 13, quantidadeEntregue: 13 },
  { id: 19, idPedido: 4, idSabor: 4, nomeSabor: "Stikadinho", quantidadeSabor: 20, quantidadeEntregue: 20 },
  { id: 20, idPedido: 4, idSabor: 5, nomeSabor: "Avelã", quantidadeSabor: 21, quantidadeEntregue: 21 },
  
  // Pedido 5 (Entregue para Bom Pão)
  { id: 21, idPedido: 5, idSabor: 1, nomeSabor: "Tradicional", quantidadeSabor: 14, quantidadeEntregue: 14 },
  { id: 22, idPedido: 5, idSabor: 2, nomeSabor: "Choco Duo", quantidadeSabor: 22, quantidadeEntregue: 22 },
  { id: 23, idPedido: 5, idSabor: 3, nomeSabor: "Meio Amargo", quantidadeSabor: 10, quantidadeEntregue: 10 },
  { id: 24, idPedido: 5, idSabor: 4, nomeSabor: "Stikadinho", quantidadeSabor: 16, quantidadeEntregue: 16 },
  { id: 25, idPedido: 5, nomeSabor: "Avelã", quantidadeSabor: 18, quantidadeEntregue: 18 }
];

// Alertas mockados
export const alertasMock: Alerta[] = [
  {
    id: 1,
    tipo: "EstoqueAbaixoMinimo",
    mensagem: "Estoque de Avelã está abaixo do mínimo! Saldo atual: 22, Mínimo: 40",
    dataAlerta: new Date("2024-05-13T08:30:00"),
    lida: false,
    dados: {
      idSabor: 5,
      nomeSabor: "Avelã",
      saldoAtual: 22,
      estoqueMinimo: 40
    }
  },
  {
    id: 2,
    tipo: "EstoqueAbaixoMinimo",
    mensagem: "Estoque de Pistache está abaixo do mínimo! Saldo atual: 8, Mínimo: 10",
    dataAlerta: new Date("2024-05-13T08:30:00"),
    lida: false,
    dados: {
      idSabor: 10,
      nomeSabor: "Pistache",
      saldoAtual: 8,
      estoqueMinimo: 10
    }
  },
  {
    id: 3,
    tipo: "ProximasEntregas",
    mensagem: "2 entregas agendadas para amanhã (14/05/2024)",
    dataAlerta: new Date("2024-05-13T07:00:00"),
    lida: true,
    dados: {
      dataEntrega: "2024-05-14",
      quantidadePedidos: 2,
      idsPedidos: [1, 2]
    }
  },
  {
    id: 4,
    tipo: "DeltaForaTolerancia",
    mensagem: "Recálculo de Qp para 'Café Central' devido a Δ fora da tolerância",
    dataAlerta: new Date("2024-05-07T15:45:00"),
    lida: true,
    dados: {
      idCliente: 1,
      nomeCliente: "Café Central",
      deltaEfetivo: 9,
      periodicidadePadrao: 7,
      qpAntigo: 90,
      qpNovo: 100
    }
  }
];

// Relacionamento: adicionar itens de pedido aos pedidos correspondentes
export function relacionarItensPedidos() {
  pedidosMock.forEach(pedido => {
    pedido.itensPedido = itensPedidoMock.filter(item => item.idPedido === pedido.id);
  });
  
  return pedidosMock;
}

// Função para adicionar referências de cliente aos pedidos
export function relacionarClientesPedidos() {
  const pedidosComClientes = pedidosMock.map(pedido => {
    const cliente = clientesMock.find(c => c.id === pedido.idCliente);
    return { ...pedido, cliente };
  });
  
  return pedidosComClientes;
}

// Função para adicionar referências de sabor aos itens de pedido
export function relacionarSaboresItensPedido() {
  const itensComSabores = itensPedidoMock.map(item => {
    const sabor = saboresMock.find(s => s.id === item.idSabor);
    return { ...item, sabor };
  });
  
  return itensComSabores;
}

// Relações completas
export function dadosCompletos() {
  const pedidosComItens = relacionarItensPedidos();
  const pedidosComClientes = relacionarClientesPedidos();
  const itensComSabores = relacionarSaboresItensPedido();
  
  // Substituir itens de pedido pelos itens com sabores
  pedidosComClientes.forEach(pedido => {
    pedido.itensPedido = itensComSabores.filter(item => item.idPedido === pedido.id);
  });
  
  return {
    clientes: clientesMock,
    sabores: saboresMock,
    pedidos: pedidosComClientes,
    alertas: alertasMock
  };
}
