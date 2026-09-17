/**
 * Monta e copia o texto de credenciais que o admin manda para o representante.
 *
 * A senha nao fica guardada em lugar nenhum (o Supabase so guarda o hash), entao
 * ela so entra no texto quando acabou de ser definida nesta mesma tela.
 */

const CAMINHO_LOGIN = "/auth";

export function urlDeLogin() {
  return `${window.location.origin}${CAMINHO_LOGIN}`;
}

interface DadosCredenciais {
  nome?: string;
  email: string;
  senha?: string;
}

export function montarTextoCredenciais({ nome, email, senha }: DadosCredenciais) {
  const linhas = [
    "🔐 Acesso ao Mischa OS",
    "",
  ];

  if (nome) linhas.push(`Nome: ${nome}`);
  linhas.push(`Link: ${urlDeLogin()}`);
  linhas.push(`Email: ${email}`);

  if (senha) {
    linhas.push(`Senha: ${senha}`);
    linhas.push("", "Troque a senha depois do primeiro acesso.");
  } else {
    linhas.push(
      "",
      'A senha nao fica guardada no sistema. Para gerar uma nova, use "Editar acesso".'
    );
  }

  return linhas.join("\n");
}

export async function copiarTexto(texto: string) {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    // Fallback para navegador/contexto sem acesso direto a area de transferencia
    try {
      const area = document.createElement("textarea");
      area.value = texto;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(area);
      return ok;
    } catch {
      return false;
    }
  }
}

export async function copiarCredenciais(dados: DadosCredenciais) {
  return copiarTexto(montarTextoCredenciais(dados));
}
