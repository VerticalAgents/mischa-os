/**
 * Os textos prontos.
 *
 * O botão escreve **direto na caixa de digitação do WhatsApp**. Ajustar o texto
 * dentro do painel e depois mandar para a caixa era um passo a mais sem ganho:
 * o lugar natural de reescrever é a própria caixa, onde ele já está.
 *
 * A extensão continua sem enviar nada — quem aperta enviar é o Lucca.
 */
import { useState } from 'react';
import { inserirNaCaixa } from './useChatAberto';
import Icone from './Icone';
import type { ClienteDoPainel, AgendamentoDoPainel, EntregaDoPainel, FinanceiroDoPainel } from '@ext/lib/queries';
import {
  confirmarProximoPedido,
  lembreteDePagamento,
  resumoUltimosPedidos,
  sugestaoIgualUltimoPedido,
  sugestaoPeloGiro,
  avisoTrocasBonificacoes,
  type ItemDeSabor,
} from '@ext/templates/mensagens';

interface Props {
  cliente: ClienteDoPainel;
  agendamento: AgendamentoDoPainel | null;
  entregas: EntregaDoPainel[];
  financeiro: FinanceiroDoPainel | null;
  giroSemanal: number | null;
}

const diasDesde = (iso: string) =>
  Math.round((Date.now() - new Date(`${iso.slice(0, 10)}T00:00:00`).getTime()) / 86400000);

/** Múltiplo de 5, respeitando o pedido mínimo — do jeito que a fábrica embala. */
const arredondarPedido = (quantidade: number) => Math.max(30, Math.round(quantidade / 5) * 5);

export default function Mensagens({ cliente, agendamento, entregas, financeiro, giroSemanal }: Props) {
  const [recado, setRecado] = useState<string | null>(null);
  // Qual mensagem foi escrita por último e em qual jeito de dizer. Clicar de
  // novo troca a variação, substituindo o texto na caixa em vez de empilhar.
  const [ultima, setUltima] = useState<{ rotulo: string; variante: number } | null>(null);

  const contato = cliente.contato_nome;
  const ultimaEntrega = entregas[0];
  const ultima_ = ultimaEntrega; // nome curto, usado abaixo

  const opcoes: { rotulo: string; disponivel: boolean; montar: (variante: number) => string }[] = [
    {
      rotulo: 'Confirmar próxima reposição',
      disponivel: !!agendamento?.data_proxima_reposicao,
      montar: (v) =>
        confirmarProximoPedido({
          contato,
          data: agendamento!.data_proxima_reposicao!,
          quantidade: agendamento!.quantidade_total ?? 0,
          itens: (agendamento!.itens_personalizados as ItemDeSabor[]) || [],
        }, v),
    },
    {
      rotulo: 'Lembrete de pagamento',
      disponivel: !!financeiro?.emAberto.length,
      montar: (v) => lembreteDePagamento({ contato, titulos: financeiro!.emAberto }, v),
    },
    {
      rotulo: 'Resumo dos últimos pedidos',
      disponivel: entregas.length > 0,
      montar: (v) => resumoUltimosPedidos({ contato, entregas: entregas.slice(0, 5) }, v),
    },
    {
      rotulo: 'Repetir o último pedido',
      disponivel: !!ultima_,
      montar: (v) => sugestaoIgualUltimoPedido({ contato, ultimaEntrega: ultima_ }, v),
    },
    {
      rotulo: 'Sugerir pelo giro',
      disponivel: !!giroSemanal && !!ultima_,
      montar: (v) => {
        const dias = diasDesde(ultima_.data);
        return sugestaoPeloGiro(
          {
            contato,
            giroSemanal: giroSemanal!,
            diasDesdeUltimaEntrega: dias,
            quantidadeSugerida: arredondarPedido((giroSemanal! * dias) / 7),
          },
          v
        );
      },
    },
    {
      rotulo: 'Avisar troca ou bonificação',
      disponivel: !!(agendamento?.trocas_pendentes?.length || agendamento?.bonificacoes_pendentes?.length),
      montar: (v) =>
        avisoTrocasBonificacoes({
          contato,
          trocas: ((agendamento!.trocas_pendentes || []) as { produto_nome?: string; quantidade?: number }[]).map(
            (t) => ({ produto: t.produto_nome || 'brownie', quantidade: t.quantidade ?? 0 })
          ),
          bonificacoes: ((agendamento!.bonificacoes_pendentes || []) as { produto_nome?: string; quantidade?: number }[]).map(
            (b) => ({ produto: b.produto_nome || 'brownie', quantidade: b.quantidade ?? 0 })
          ),
        }, v),
    },
  ];

  const escrever = async (rotulo: string, montar: (v: number) => string, trocandoJeito = false) => {
    const variante = trocandoJeito && ultima?.rotulo === rotulo ? ultima.variante + 1 : 0;
    const texto = montar(variante);

    const ok = await inserirNaCaixa(texto, trocandoJeito);

    if (!ok) {
      await navigator.clipboard.writeText(texto);
      setRecado('Não consegui escrever na caixa, então copiei. Cole com Ctrl+V.');
      return;
    }

    setUltima({ rotulo, variante });
    setRecado('Está na caixa. Confira, ajuste se quiser, e envie você.');
  };

  const opcaoAtual = opcoes.find((o) => o.rotulo === ultima?.rotulo);

  return (
    <div className="cartao">
      <div className="titulo-com-icone">
        <Icone nome="balao" />
        <h2>Mensagens</h2>
      </div>

      <div className="campos">
        {opcoes.map((o) => (
          <button
            key={o.rotulo}
            className={`secundario ${ultima?.rotulo === o.rotulo ? 'escrita' : ''}`}
            disabled={!o.disponivel}
            title={o.disponivel ? undefined : 'sem dado para montar esta mensagem'}
            onClick={() => escrever(o.rotulo, o.montar)}
          >
            {o.rotulo}
          </button>
        ))}
      </div>

      {ultima && opcaoAtual && (
        <div className="campos rascunho">
          {recado && <p className="apagado">{recado}</p>}
          <button
            className="secundario"
            onClick={() => escrever(opcaoAtual.rotulo, opcaoAtual.montar, true)}
          >
            Escrever de outro jeito
          </button>
          <p className="apagado">A extensão nunca envia. Quem aperta enviar é você.</p>
        </div>
      )}

      {!ultima && recado && <p className="apagado">{recado}</p>}
    </div>
  );
}
