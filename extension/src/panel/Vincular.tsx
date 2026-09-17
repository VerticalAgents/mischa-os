/**
 * "De quem é essa conversa?"
 *
 * Como o WhatsApp não mostra mais o telefone, este é o caminho normal de
 * reconhecimento: o Lucca escolhe o cliente uma vez e a extensão guarda.
 */
import { useMemo, useState } from 'react';
import type { ClienteResumido } from '@ext/lib/resolverCliente';
import { simplificar } from '@ext/lib/resolverCliente';

interface Props {
  titulo: string | null;
  clientes: ClienteResumido[];
  aoVincular: (clienteId: string) => Promise<void>;
  aoCancelar?: () => void;
}

export default function Vincular({ titulo, clientes, aoVincular, aoCancelar }: Props) {
  const [busca, setBusca] = useState(titulo || '');
  const [salvando, setSalvando] = useState<string | null>(null);

  const achados = useMemo(() => {
    const termo = simplificar(busca);
    if (!termo) return clientes.slice(0, 20);
    return clientes.filter((c) => simplificar(c.nome).includes(termo)).slice(0, 20);
  }, [busca, clientes]);

  return (
    <div className="campos">
      <div>
        <label htmlFor="busca">Qual cliente é esta conversa?</label>
        <input
          id="busca"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="procure pelo nome"
          autoFocus
        />
      </div>

      <ul className="lista">
        {achados.map((c) => (
          <li key={c.id}>
            <button
              className="secundario"
              disabled={!!salvando}
              onClick={async () => {
                setSalvando(c.id);
                await aoVincular(c.id);
                setSalvando(null);
              }}
            >
              {salvando === c.id ? 'vinculando…' : c.nome}
            </button>
          </li>
        ))}
        {!achados.length && <li className="apagado">Nenhum cliente com esse nome.</li>}
      </ul>

      {aoCancelar && (
        <button className="secundario" onClick={aoCancelar}>
          Cancelar
        </button>
      )}
    </div>
  );
}
