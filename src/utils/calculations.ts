
import { Cliente, Pedido, Sabor, ItemPedido } from "../types";

// Cálculo de distribuição de sabores com base no percentual padrão
export function calcularDistribuicaoSabores(
  sabores: Sabor[],
  totalUnidades: number
): ItemPedido[] {
  // Filtrar sabores ativos
  const saboresAtivos = sabores.filter(sabor => sabor.ativo);
  
  // Calcular as quantidades fracionárias
  const qtdesFracionarias = saboresAtivos.map(sabor => ({
    idSabor: sabor.id,
    percentualPadraoDist: sabor.percentualPadraoDist,
    qtdeFrac: (sabor.percentualPadraoDist / 100) * totalUnidades,
    baseSabor: Math.floor((sabor.percentualPadraoDist / 100) * totalUnidades)
  }));
  
  // Calcular a soma das bases
  const somaBases = qtdesFracionarias.reduce((sum, item) => sum + item.baseSabor, 0);
  
  // Calcular a diferença a ser distribuída
  const restoTotal = totalUnidades - somaBases;
  
  // Calcular as diferenças fracionárias
  const diffFrac = qtdesFracionarias.map(item => ({
    ...item,
    diffFrac: item.qtdeFrac - item.baseSabor
  }));
  
  // Ordenar em ordem decrescente de diffFrac
  diffFrac.sort((a, b) => b.diffFrac - a.diffFrac);
  
  // Distribuir o restoTotal
  const resultado = diffFrac.map((item, index) => ({
    idSabor: item.idSabor,
    quantidadeSabor: item.baseSabor + (index < restoTotal ? 1 : 0)
  }));
  
  return resultado.map((item, index) => ({
    id: 0, // Este ID seria gerado pelo backend
    idPedido: 0, // Este ID será definido quando o pedido for salvo
    idSabor: item.idSabor,
    quantidadeSabor: item.quantidadeSabor
  }));
}

// Cálculo de delta efetivo (dias entre entregas)
export function calcularDeltaEfetivo(dataAtual: Date, dataAnterior: Date): number {
  const diffTempo = dataAtual.getTime() - dataAnterior.getTime();
  return Math.round(diffTempo / (1000 * 60 * 60 * 24)); // Converter ms para dias
}

// Verificar se o delta está fora da tolerância
export function deltaForaTolerancia(delta: number, periodicidadePadrao: number): boolean {
  const tolerancia = periodicidadePadrao * 0.25;
  return delta < (periodicidadePadrao - tolerancia) || delta > (periodicidadePadrao + tolerancia);
}

// Calcular giro semanal de um PDV
export function calcularGiroSemanalPDV(
  totalEntregueUltimaVez: number, 
  deltaEfetivo: number
): number {
  return totalEntregueUltimaVez * (7 / deltaEfetivo);
}

// Calcular novo Qp com base no giro
export function calcularNovoQp(
  giroSemanalPDV: number, 
  periodicidadePadrao: number
): number {
  return Math.round(giroSemanalPDV * (periodicidadePadrao / 7));
}

// Calcular o total de unidades entregues na última vez
export function calcularTotalEntregue(itensPedido: ItemPedido[]): number {
  return itensPedido.reduce((total, item) => 
    total + (item.quantidadeEntregue ?? item.quantidadeSabor), 0);
}

// Cálculo do número de formas necessárias para produção
export function calcularFormasNecessarias(qtdUnidades: number, capacidadeForma: number = 40): number {
  return Math.ceil(qtdUnidades / capacidadeForma);
}

// Validar a soma dos percentuais de distribuição
export function validarPercentuaisSabores(sabores: Sabor[]): boolean {
  const saboresAtivos = sabores.filter(sabor => sabor.ativo);
  const somaPercentuais = saboresAtivos.reduce(
    (sum, sabor) => sum + sabor.percentualPadraoDist, 0
  );
  
  // Pequena margem de erro devido a possíveis arredondamentos
  return Math.abs(somaPercentuais - 100) < 0.001; 
}

// Calcular a previsão de giro semanal
export function calcularPrevisaoGiroSemanal(clientes: Cliente[]): number {
  const clientesAtivos = clientes.filter(c => c.statusCliente === "Ativo");
  
  return clientesAtivos.reduce((total, cliente) => {
    // Se a periodicidade for semanal, use a quantidade padrão diretamente
    if (cliente.periodicidadePadrao === 7) {
      return total + cliente.quantidadePadrao;
    }
    
    // Para outras periodicidades, ajustar para base semanal
    return total + (cliente.quantidadePadrao * (7 / cliente.periodicidadePadrao));
  }, 0);
}

// Calcular a previsão de giro mensal
export function calcularPrevisaoGiroMensal(giroSemanal: number): number {
  return giroSemanal * 4.33; // 4.33 semanas em média por mês
}
