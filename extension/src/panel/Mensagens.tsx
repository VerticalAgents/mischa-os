/**
 * Os textos prontos.
 *
 * O botão não escreve direto na conversa: ele abre o texto num campo editável.
 * O Lucca lê, ajusta o tom se quiser, e só então manda para a caixa — onde
 * ainda é ele quem aperta enviar. É o que separa ferramenta de robô.
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
  const [texto, setTexto] = useState<string | null>(null);
  const [recado, setRecado] = useState<string | null>(null);
  // Qual mensagem está aberta e em qual jeito de dizer. Clicar no mesmo botão
  // de novo avança a variação, em vez de repetir o texto igualzinho.
  const [aberta, setAberta] = useState<{ rotulo: string; variante: number } | null>(null);

  const contato = cliente.contato_nome;
  const ultima = entregas[0];

  const abrir = (rotulo: string, montar: (variante: number) => string) => {
    const variante = aberta?.rotulo === rotulo ? aberta.variante + 1 : 0;
    setAberta({ rotulo, variante });
    setTexto(montar(variante));
    setRecado(null);
  };

  const outroJeito = () => {
    if (!aberta) return;
    const opcao = opcoes.find((o) => o.rotulo === aberta.rotulo);
    if (!opcao) return;
    const variante = aberta.variante + 1;
    setAberta({ ...aberta, variante });
    setTexto(opcao.montar(variante));
    setRecado(null);
  };

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
      disponivel: !!ultima,
      montar: (v) => sugestaoIgualUltimoPedido({ contato, ultimaEntrega: ultima }, v),
    },
    {
      rotulo: 'Sugerir pelo giro',
      disponivel: !!giroSemanal && !!ultima,
      montar: (v) => {
        const dias = diasDesde(ultima.data);
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

  const inserir = async () => {
    if (!texto) return;
    const ok = await inserirNaCaixa(texto);
    setRecado(
      ok
        ? 'Está na caixa de digitação. Confira e envie você.'
        : 'Não consegui escrever na caixa — use o Copiar e cole com Ctrl+V.'
    );
  };

  const copiar = async () => {
    if (!texto) return;
    await navigator.clipboard.writeText(texto);
    setRecado('Copiado.');
  };

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
            className="secundario"
            disabled={!o.disponivel}
            title={o.disponivel ? undefined : 'sem dado para montar esta mensagem'}
            onClick={() => abrir(o.rotulo, o.montar)}
          >
            {o.rotulo}
          </button>
        ))}
      </div>

      {texto !== null && (
        <div className="campos rascunho">
          <textarea value={texto} onChange={(e) => setTexto(e.target.value)} rows={10} />
          <button onClick={inserir}>Inserir na conversa</button>
          <button className="secundario" onClick={outroJeito}>Escrever de outro jeito</button>
          <button className="secundario" onClick={copiar}>Copiar</button>
          <button
            className="secundario"
            onClick={() => {
              setTexto(null);
              setAberta(null);
            }}
          >
            Fechar
          </button>
          {recado && <p className="apagado">{recado}</p>}
          <p className="apagado">A extensão nunca envia. Quem aperta enviar é você.</p>
        </div>
      )}
    </div>
  );
}
