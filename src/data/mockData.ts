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
    id: "1",
    nome: "Café Central",
    cnpj_cpf: "12.345.678/0001-90",
    endereco_entrega: "Rua Central, 123",
    contato_nome: "João Silva",
    contato_telefone: "(11) 98765-4321",
    contato_email: "joao@cafecentral.com",
    quantidade_padrao: 100,
    periodicidade_padrao: 7,
    status_cliente: "Ativo",
    created_at: "2023-01-15",
    ultima_data_reposicao_efetiva: "2024-05-07",
    // Adding required fields
    contabilizar_giro_medio: true,
    tipo_logistica: "Própria",
    emite_nota_fiscal: true,
    tipo_cobranca: "À vista",
    forma_pagamento: "Boleto",
    ativo: true
  },
  {
    id: "2",
    nome: "Padaria Bom Pão",
    cnpj_cpf: "23.456.789/0001-01",
    endereco_entrega: "Av. Paes, 456",
    contato_nome: "Maria Oliveira",
    contato_telefone: "(11) 91234-5678",
    contato_email: "maria@bompao.com",
    quantidade_padrao: 80,
    periodicidade_padrao: 5,
    status_cliente: "Ativo",
    created_at: "2023-02-20",
    ultima_data_reposicao_efetiva: "2024-05-09",
    // Adding required fields
    contabilizar_giro_medio: true,
    tipo_logistica: "Própria",
    emite_nota_fiscal: true,
    tipo_cobranca: "Consignado",
    forma_pagamento: "PIX",
    ativo: true
  },
  {
    id: "3",
    nome: "Empório da Esquina",
    cnpj_cpf: "34.567.890/0001-12",
    endereco_entrega: "Rua da Esquina, 789",
    contato_nome: "Pedro Santos",
    contato_telefone: "(11) 94321-8765",
    contato_email: "pedro@emporio.com",
    quantidade_padrao: 60,
    periodicidade_padrao: 7,
    status_cliente: "Ativo",
    created_at: "2023-03-10",
    ultima_data_reposicao_efetiva: "2024-05-08",
    // Adding required fields
    contabilizar_giro_medio: true,
    tipo_logistica: "Distribuição",
    emite_nota_fiscal: false,
    tipo_cobranca: "À vista",
    forma_pagamento: "Dinheiro",
    ativo: true
  },
  {
    id: "4",
    nome: "Café Novo Horizonte",
    cnpj_cpf: "45.678.901/0001-23",
    endereco_entrega: "Av. Horizonte, 234",
    contato_nome: "Ana Souza",
    contato_telefone: "(11) 98765-1234",
    contato_email: "ana@novohorizonte.com",
    quantidade_padrao: 50,
    periodicidade_padrao: 5,
    status_cliente: "Em análise",
    created_at: "2024-04-05",
    // Adding required fields
    contabilizar_giro_medio: false,
    tipo_logistica: "Própria",
    emite_nota_fiscal: true,
    tipo_cobranca: "À vista",
    forma_pagamento: "PIX",
    ativo: false
  },
  {
    id: "5",
    nome: "Supermercado Compre Mais",
    cnpj_cpf: "56.789.012/0001-34",
    endereco_entrega: "Rua das Compras, 567",
    contato_nome: "Carlos Lima",
    contato_telefone: "(11) 91234-8765",
    contato_email: "carlos@compremais.com",
    quantidade_padrao: 120,
    periodicidade_padrao: 7,
    status_cliente: "Standby",
    created_at: "2023-05-15",
    ultima_data_reposicao_efetiva: "2024-04-25",
    // Adding required fields
    contabilizar_giro_medio: true,
    tipo_logistica: "Distribuição",
    emite_nota_fiscal: true,
    tipo_cobranca: "Consignado",
    forma_pagamento: "Boleto",
    ativo: false
  },
  {
    id: "6",
    nome: "Delícias da Vovó",
    cnpj_cpf: "67.890.123/0001-45",
    endereco_entrega: "Rua das Delícias, 890",
    contato_nome: "Laura Costa",
    contato_telefone: "(11) 94321-5678",
    contato_email: "laura@delicias.com",
    quantidade_padrao: 40,
    periodicidade_padrao: 3,
    status_cliente: "A ativar",
    created_at: "2024-05-01",
    // Adding required fields
    contabilizar_giro_medio: false,
    tipo_logistica: "Própria",
    emite_nota_fiscal: false,
    tipo_cobranca: "À vista",
    forma_pagamento: "Dinheiro",
    ativo: false
  },
  {
    id: "7",
    nome: "Mercado Bairro Feliz",
    cnpj_cpf: "78.901.234/0001-56",
    endereco_entrega: "Av. do Bairro, 123",
    contato_nome: "Rafael Alves",
    contato_telefone: "(11) 98765-4321",
    contato_email: "rafael@bairrofeliz.com",
    quantidade_padrao: 90,
    periodicidade_padrao: 7,
    status_cliente: "Inativo",
    created_at: "2023-06-25",
    ultima_data_reposicao_efetiva: "2024-03-15",
    // Adding required fields
    contabilizar_giro_medio: false,
    tipo_logistica: "Própria",
    emite_nota_fiscal: true,
    tipo_cobranca: "Consignado",
    forma_pagamento: "PIX",
    ativo: false
  }
];

// Sabores mockados com todos os campos obrigatórios
export const saboresMock: Sabor[] = [
  {
    id: 1,
    nome: "Tradicional",
    percentual_padrao_dist: 18,
    ativo: true,
    estoque_minimo: 30,
    saldo_atual: 45,
    // Adicionando campos obrigatórios faltantes
    custo_unitario: 2.50,
    preco_venda: 5.00,
    estoque_ideal: 50,
    em_producao: 0
  },
  {
    id: 2,
    nome: "Choco Duo",
    percentual_padrao_dist: 28,
    ativo: true,
    estoque_minimo: 50,
    saldo_atual: 38,
    custo_unitario: 3.00,
    preco_venda: 5.50,
    estoque_ideal: 60,
    em_producao: 0
  },
  {
    id: 3,
    nome: "Meio Amargo",
    percentual_padrao_dist: 13,
    ativo: true,
    estoque_minimo: 25,
    saldo_atual: 30,
    custo_unitario: 2.75,
    preco_venda: 5.25,
    estoque_ideal: 40,
    em_producao: 0
  },
  {
    id: 4,
    nome: "Stikadinho",
    percentual_padrao_dist: 20,
    ativo: true,
    estoque_minimo: 40,
    saldo_atual: 55,
    custo_unitario: 2.90,
    preco_venda: 5.40,
    estoque_ideal: 60,
    em_producao: 0
  },
  {
    id: 5,
    nome: "Avelã",
    percentual_padrao_dist: 20,
    ativo: true,
    estoque_minimo: 40,
    saldo_atual: 22,
    custo_unitario: 3.50,
    preco_venda: 6.00,
    estoque_ideal: 50,
    em_producao: 0
  },
  {
    id: 6,
    nome: "Blondie",
    percentual_padrao_dist: 0,
    ativo: true,
    estoque_minimo: 15,
    saldo_atual: 12,
    custo_unitario: 3.20,
    preco_venda: 5.80,
    estoque_ideal: 30,
    em_producao: 0
  },
  {
    id: 7,
    nome: "Doce de Leite",
    percentual_padrao_dist: 1,
    ativo: true,
    estoque_minimo: 15,
    saldo_atual: 18,
    custo_unitario: 2.80,
    preco_venda: 5.30,
    estoque_ideal: 30,
    em_producao: 0
  },
  {
    id: 8,
    nome: "Nesquik",
    percentual_padrao_dist: 0,
    ativo: true,
    estoque_minimo: 15,
    saldo_atual: 10,
    custo_unitario: 2.60,
    preco_venda: 5.20,
    estoque_ideal: 25,
    em_producao: 0
  },
  {
    id: 9,
    nome: "Oreo Cream",
    percentual_padrao_dist: 0,
    ativo: true,
    estoque_minimo: 15,
    saldo_atual: 25,
    custo_unitario: 3.30,
    preco_venda: 5.90,
    estoque_ideal: 35,
    em_producao: 0
  },
  {
    id: 10,
    nome: "Pistache",
    percentual_padrao_dist: 0,
    ativo: true,
    estoque_minimo: 10,
    saldo_atual: 8,
    custo_unitario: 4.00,
    preco_venda: 7.00,
    estoque_ideal: 20,
    em_producao: 0
  }
];

// Criando pedidos para a data de hoje
const hoje = new Date();
hoje.setHours(0, 0, 0, 0);

// Pedidos mockados - Modificando para ter 10 entregas agendadas para hoje com diferentes configurações
export const pedidosMock: Pedido[] = [
  // Pedido 1: Agendado para hoje - status "Agendado"
  {
    id: 1,
    idCliente: "1",
    dataPedido: new Date(hoje.getTime() - 86400000 * 2), // 2 dias atrás
    dataPrevistaEntrega: hoje,
    totalPedidoUnidades: 100,
    tipoPedido: "Padrão",
    statusPedido: "Agendado",
    substatusPedido: "Agendado",
    observacoes: "Entrega antes das 10h",
    itensPedido: []
  },
  // Rest of pedidos with string IDs
  {
    id: 2,
    idCliente: "2",
    dataPedido: new Date(hoje.getTime() - 86400000 * 1), // 1 dia atrás
    dataPrevistaEntrega: hoje,
    totalPedidoUnidades: 80,
    tipoPedido: "Alterado",
    statusPedido: "Agendado",
    substatusPedido: "Agendado",
    observacoes: "Cliente pediu mais Avelã e menos Tradicional",
    itensPedido: []
  },
  {
    id: 3,
    idCliente: "3",
    dataPedido: new Date(hoje.getTime() - 86400000 * 3), // 3 dias atrás
    dataPrevistaEntrega: hoje,
    totalPedidoUnidades: 60,
    tipoPedido: "Padrão",
    statusPedido: "Agendado",
    substatusPedido: "Separado",
    itensPedido: []
  },
  {
    id: 4,
    idCliente: "4",
    dataPedido: new Date(hoje.getTime() - 86400000 * 2), // 2 dias atrás
    dataPrevistaEntrega: hoje,
    totalPedidoUnidades: 50,
    tipoPedido: "Padrão",
    statusPedido: "Entregue",
    dataEfetivaEntrega: new Date(hoje.setHours(9, 30, 0, 0)),
    itensPedido: []
  },
  {
    id: 5,
    idCliente: "5",
    dataPedido: new Date(hoje.getTime() - 86400000 * 1), // 1 dia atrás
    dataPrevistaEntrega: hoje,
    totalPedidoUnidades: 120,
    tipoPedido: "Padrão",
    statusPedido: "Despachado",
    substatusPedido: "Despachado",
    observacoes: "Em rota de entrega desde 8h30",
    itensPedido: []
  },
  {
    id: 6,
    idCliente: "0", // 0 indica pedido único
    dataPedido: new Date(hoje.getTime() - 86400000 * 2), // 2 dias atrás
    dataPrevistaEntrega: hoje,
    totalPedidoUnidades: 30,
    tipoPedido: "Alterado",
    statusPedido: "Agendado",
    substatusPedido: "Agendado",
    observacoes: "PEDIDO ÚNICO\nNome: Evento Corporativo ABC\nTelefone: (11) 97777-8888\nLevem em caixas separadas",
    itensPedido: []
  },
  {
    id: 7,
    idCliente: "0", // 0 indica pedido único
    dataPedido: new Date(hoje.getTime() - 86400000 * 1), // 1 dia atrás
    dataPrevistaEntrega: hoje,
    totalPedidoUnidades: 25,
    tipoPedido: "Alterado",
    statusPedido: "Despachado",
    substatusPedido: "Despachado",
    observacoes: "PEDIDO ÚNICO\nNome: Festa de Aniversário\nTelefone: (11) 96666-5555\nEntregar no salão de festas",
    itensPedido: []
  },
  {
    id: 8,
    idCliente: "6",
    dataPedido: new Date(hoje.getTime() - 86400000 * 2), // 2 dias atrás
    dataPrevistaEntrega: hoje,
    totalPedidoUnidades: 40,
    tipoPedido: "Padrão",
    statusPedido: "Agendado",
    substatusPedido: "Separado",
    observacoes: "Primeira entrega para este PDV",
    itensPedido: []
  },
  {
    id: 9,
    idCliente: "7",
    dataPedido: new Date(hoje.getTime() - 86400000 * 3), // 3 dias atrás
    dataPrevistaEntrega: hoje,
    totalPedidoUnidades: 90,
    tipoPedido: "Padrão",
    statusPedido: "Agendado",
    substatusPedido: "Agendado",
    itensPedido: []
  },
  {
    id: 10,
    idCliente: "4",
    dataPedido: new Date(hoje.getTime() - 86400000 * 1), // 1 dia atrás
    dataPrevistaEntrega: hoje,
    totalPedidoUnidades: 30,
    tipoPedido: "Alterado",
    statusPedido: "Agendado",
    substatusPedido: "Agendado",
    observacoes: "Pedido reduzido a pedido do cliente para teste de mercado",
    itensPedido: []
  }
];

// Itens de pedido mockados com nomeSabor adicionado (mantendo os existentes)
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
  { id: 25, idPedido: 5, idSabor: 5, nomeSabor: "Avelã", quantidadeSabor: 18, quantidadeEntregue: 18 },
  
  // Novos itens para os pedidos 6-10 (adicionados agora)
  
  // Pedido 6: Pedido Único para evento
  { id: 26, idPedido: 6, idSabor: 1, nomeSabor: "Tradicional", quantidadeSabor: 5 },
  { id: 27, idPedido: 6, idSabor: 2, nomeSabor: "Choco Duo", quantidadeSabor: 10 },
  { id: 28, idPedido: 6, idSabor: 4, nomeSabor: "Stikadinho", quantidadeSabor: 5 },
  { id: 29, idPedido: 6, idSabor: 5, nomeSabor: "Avelã", quantidadeSabor: 10 },
  
  // Pedido 7: Outro Pedido Único para festa
  { id: 30, idPedido: 7, idSabor: 1, nomeSabor: "Tradicional", quantidadeSabor: 5 },
  { id: 31, idPedido: 7, idSabor: 2, nomeSabor: "Choco Duo", quantidadeSabor: 5 },
  { id: 32, idPedido: 7, idSabor: 3, nomeSabor: "Meio Amargo", quantidadeSabor: 5 },
  { id: 33, idPedido: 7, idSabor: 9, nomeSabor: "Oreo Cream", quantidadeSabor: 10 },
  
  // Pedido 8: PDV Delícias da Vovó
  { id: 34, idPedido: 8, idSabor: 1, nomeSabor: "Tradicional", quantidadeSabor: 8 },
  { id: 35, idPedido: 8, idSabor: 2, nomeSabor: "Choco Duo", quantidadeSabor: 12 },
  { id: 36, idPedido: 8, idSabor: 3, nomeSabor: "Meio Amargo", quantidadeSabor: 5 },
  { id: 37, idPedido: 8, idSabor: 4, nomeSabor: "Stikadinho", quantidadeSabor: 7 },
  { id: 38, idPedido: 8, idSabor: 5, nomeSabor: "Avelã", quantidadeSabor: 8 },
  
  // Pedido 9: PDV Bairro Feliz
  { id: 39, idPedido: 9, idSabor: 1, nomeSabor: "Tradicional", quantidadeSabor: 16 },
  { id: 40, idPedido: 9, idSabor: 2, nomeSabor: "Choco Duo", quantidadeSabor: 24 },
  { id: 41, idPedido: 9, idSabor: 3, nomeSabor: "Meio Amargo", quantidadeSabor: 12 },
  { id: 42, idPedido: 9, idSabor: 4, nomeSabor: "Stikadinho", quantidadeSabor: 18 },
  { id: 43, idPedido: 9, idSabor: 5, nomeSabor: "Avelã", quantidadeSabor: 20 },
  
  // Pedido 10: PDV novo com pedido de teste
  { id: 44, idPedido: 10, idSabor: 1, nomeSabor: "Tradicional", quantidadeSabor: 5 },
  { id: 45, idPedido: 10, idSabor: 2, nomeSabor: "Choco Duo", quantidadeSabor: 10 },
  { id: 46, idPedido: 10, idSabor: 5, nomeSabor: "Avelã", quantidadeSabor: 5 },
  { id: 47, idPedido: 10, idSabor: 6, nomeSabor: "Blondie", quantidadeSabor: 5 },
  { id: 48, idPedido: 10, idSabor: 7, nomeSabor: "Doce de Leite", quantidadeSabor: 5 },
  
  // Adicionar também itens entregues para o pedido já entregue (id 4)
  { id: 49, idPedido: 4, idSabor: 1, nomeSabor: "Tradicional", quantidadeSabor: 9, quantidadeEntregue: 9 },
  { id: 50, idPedido: 4, idSabor: 2, nomeSabor: "Choco Duo", quantidadeSabor: 14, quantidadeEntregue: 14 },
  { id: 51, idPedido: 4, idSabor: 3, nomeSabor: "Meio Amargo", quantidadeSabor: 7, quantidadeEntregue: 7 },
  { id: 52, idPedido: 4, idSabor: 4, nomeSabor: "Stikadinho", quantidadeSabor: 10, quantidadeEntregue: 10 },
  { id: 53, idPedido: 4, idSabor: 5, nomeSabor: "Avelã", quantidadeSabor: 10, quantidadeEntregue: 10 }
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
