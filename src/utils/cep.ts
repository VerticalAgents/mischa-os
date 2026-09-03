/**
 * Busca de endereço por CEP, via ViaCEP.
 *
 * O ViaCEP é público, não pede cadastro nem chave e responde direto do
 * navegador — por isso não precisa de edge function no meio. A falha de rede
 * não é tratada aqui de propósito: o `fetch` global já foi envolvido em
 * `utils/rede.ts`, então uma queda de internet chega como `ErroDeRede` com a
 * mensagem em português, igual ao resto do app.
 */

export const CEP_INCOMPLETO = "CEP precisa ter 8 dígitos.";
export const CEP_NAO_ENCONTRADO = "CEP não encontrado.";

export interface EnderecoDoCep {
  cep: string;
  logradouro: string;
  bairro: string;
  cidade: string;
  uf: string;
}

/** Só os dígitos: o usuário digita com ponto, traço ou espaço. */
export const digitosDoCep = (valor: string): string =>
  (valor || "").replace(/\D/g, "").slice(0, 8);

/** `95010000` -> `95010-000`. Formata enquanto ele digita, sem atrapalhar. */
export const formatarCep = (valor: string): string => {
  const d = digitosDoCep(valor);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
};

export const cepCompleto = (valor: string): boolean =>
  digitosDoCep(valor).length === 8;

export async function buscarEnderecoPorCep(valor: string): Promise<EnderecoDoCep> {
  const cep = digitosDoCep(valor);
  if (cep.length !== 8) throw new Error(CEP_INCOMPLETO);

  const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
  if (!resposta.ok) throw new Error(CEP_NAO_ENCONTRADO);

  const dados = await resposta.json();
  // CEP inexistente devolve 200 com `{ "erro": "true" }` — repare que vem como
  // texto, e não booleano, e que o status HTTP continua sendo 200.
  if (!dados || dados.erro) throw new Error(CEP_NAO_ENCONTRADO);

  return {
    cep: formatarCep(cep),
    logradouro: dados.logradouro || "",
    bairro: dados.bairro || "",
    cidade: dados.localidade || "",
    uf: dados.uf || "",
  };
}

/**
 * O endereço numa linha só, do jeito que o campo de texto do cadastro espera.
 *
 * O número entra por fora porque o ViaCEP não tem como saber qual é — quem sabe
 * é o usuário. Recebê-lo aqui, em vez de deixar um buraco no texto para ele
 * preencher na mão, evita que o endereço fique salvo pela metade quando ele
 * esquecer de voltar no campo.
 */
export const enderecoEmUmaLinha = (e: EnderecoDoCep, numero?: string): string => {
  const rua = [e.logradouro, (numero || "").trim()].filter(Boolean).join(", ");
  return [rua, e.bairro, e.cidade && e.uf ? `${e.cidade}/${e.uf}` : e.cidade, e.cep && `CEP ${e.cep}`]
    .filter(Boolean)
    .join(" - ");
};

/**
 * Link que abre o endereço no Google Maps.
 *
 * Usa o Maps URLs, que é a via oficial do Google e **não pede chave de API, conta
 * de faturamento nem tem cota** — ao contrário do Geocoding e do Places. Como o
 * endereço já vem com rua, número, bairro, cidade/UF e CEP, a busca costuma cair
 * no ponto certo sem precisar converter para coordenadas.
 *
 * O `api=1` é obrigatório: sem ele o Google ignora os outros parâmetros.
 */
export const linkDoGoogleMaps = (endereco: string): string =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(endereco)}`;
