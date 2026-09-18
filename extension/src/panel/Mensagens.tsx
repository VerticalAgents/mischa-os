/**
 * Os textos prontos.
 *
 * O botão escreve **direto na caixa de digitação do WhatsApp**. Ajustar o texto
 * dentro do painel e depois mandar para a caixa era um passo a mais sem ganho:
 * o lugar natural de reescrever é a própria caixa, onde ele já está.
 *
 * A extensão continua sem enviar nada — quem aperta enviar é o Lucca.
 */
import { useEffect, useState } from 'react';
import { inserirNaCaixa } from './useChatAberto';
import Icone from './Icone';
import type { ClienteDoPainel, AgendamentoDoPainel, EntregaDoPainel, FinanceiroDoPainel } from '@ext/lib/queries';
import {
  confirmarProximoPedido,
  lembreteDePagamento,
  resumoUltimosPedidos,
  sugestaoIgualUltimoPedido,
  avisoTrocasBonificacoes,
  type ItemDeSabor,
} from '@ext/templates/mensagens';

interface Props {
  cliente: ClienteDoPainel;
  agendamento: AgendamentoDoPainel | null;
  entregas: EntregaDoPainel[];
  financeiro: FinanceiroDoPainel | null;
}

export default function Mensagens({ cliente, agendamento, entregas, financeiro }: Props) {
  const [recado, setRecado] = useState<string | null>(null);
  // Qual mensagem foi escrita por último, para o próximo clique substituir o
  // texto na caixa em vez de empilhar outro embaixo.
  const [ultima, setUltima] = useState<{ rotulo: string; variante: number } | null>(null);

  /**
   * Quantas vezes cada mensagem já foi usada.
   *
   * É o que faz o texto mudar a cada clique em vez de sair sempre igual. Fica
   * guardado no navegador: se zerasse ao fechar o painel, o cliente receberia a
   * primeira variação toda semana — que é exatamente o que soa de robô.
   */
  const [usos, setUsos] = useState<Record<string, number>>({});

  useEffect(() => {
    chrome.storage.local.get('variacoes-usadas').then((guardado) => {
      setUsos((guardado?.['variacoes-usadas'] as Record<string, number>) || {});
    });
  }, []);

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

  const escrever = async (rotulo: string, montar: (v: number) => string) => {
    const variante = usos[rotulo] ?? 0;
    const texto = montar(variante);

    // Substitui quando o texto na caixa é desta mesma mensagem — trocar o jeito
    // de dizer não pode empilhar duas versões da mesma coisa.
    const ok = await inserirNaCaixa(texto, ultima?.rotulo === rotulo);

    if (!ok) {
      await navigator.clipboard.writeText(texto);
      setRecado('Não consegui escrever na caixa, então copiei. Cole com Ctrl+V.');
      return;
    }

    setUltima({ rotulo, variante });

    const proximos = { ...usos, [rotulo]: variante + 1 };
    setUsos(proximos);
    chrome.storage.local.set({ 'variacoes-usadas': proximos });

    setRecado('Está na caixa. Confira, ajuste se quiser, e envie você.');
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
            className={`secundario ${ultima?.rotulo === o.rotulo ? 'escrita' : ''}`}
            disabled={!o.disponivel}
            title={o.disponivel ? undefined : 'sem dado para montar esta mensagem'}
            onClick={() => escrever(o.rotulo, o.montar)}
          >
            {o.rotulo}
          </button>
        ))}
      </div>

      {recado && <p className="apagado">{recado}</p>}
      {ultima && (
        <p className="apagado">Clique de novo no mesmo botão para escrever de outro jeito.</p>
      )}

    </div>
  );
}
