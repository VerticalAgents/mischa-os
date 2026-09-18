/**
 * Ícones do painel.
 *
 * Desenhados à mão em SVG, sem biblioteca: são seis, e trazer a `lucide-react`
 * para dentro da extensão só por isso engordaria o pacote à toa. O traço segue
 * o do app (2px, pontas arredondadas).
 */

type Nome = 'calendario' | 'carteira' | 'caminhao' | 'balao' | 'troca' | 'raio';

const CAMINHOS: Record<Nome, JSX.Element> = {
  calendario: (
    <>
      <rect x="3" y="4.5" width="18" height="16" rx="3" />
      <path d="M8 2.5v4M16 2.5v4M3 10h18" />
    </>
  ),
  carteira: (
    <>
      <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H18a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3z" />
      <path d="M16.5 12.5h.01" />
    </>
  ),
  caminhao: (
    <>
      <path d="M3 6.5h10v9H3zM13 9.5h4l4 3.5v2.5h-8z" />
      <circle cx="7" cy="18" r="1.8" />
      <circle cx="17" cy="18" r="1.8" />
    </>
  ),
  balao: <path d="M20 12a7.5 7.5 0 0 1-11 6.6L4 20l1.4-4.2A7.5 7.5 0 1 1 20 12z" />,
  troca: (
    <>
      <path d="M4 9h12l-3-3M20 15H8l3 3" />
    </>
  ),
  raio: <path d="M13 2 4.5 13.5H11l-1 8.5 8.5-11.5H12z" />,
};

export default function Icone({ nome, tamanho = 16 }: { nome: Nome; tamanho?: number }) {
  return (
    <svg
      className="icone"
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {CAMINHOS[nome]}
    </svg>
  );
}
