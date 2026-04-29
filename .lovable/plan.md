## Diagnóstico

O problema agora tem **duas camadas**:

### 1. Bloqueio por muitas tentativas

A função `check_rate_limit` está retornando `false` para:

- `luccab.milleto@gmail.com`
- `enzomilleto@mischas.com`
- `biabuchmann@gmail.com`

Ou seja: o próprio app está bloqueando o login antes de chegar no Supabase Auth, porque houve várias tentativas falhas nos últimos 15 minutos.

A regra atual é:

```text
máximo 5 tentativas falhas nos últimos 15 minutos
por IP OU por email
```

Como o app está registrando o IP como `127.0.0.1`, as tentativas de usuários diferentes acabam somando no mesmo IP interno e bloqueando todo mundo mais rápido. Isso explica por que você também parou de conseguir logar depois das tentativas do Enzo/Bia.

### 2. Senhas possivelmente dessincronizadas

No banco:

| Usuário | Email | Status | Role | Último login |
|---|---|---|---|---|
| Lucca | `luccab.milleto@gmail.com` | confirmado / não banido | admin | hoje 14:07 |
| Enzo | `enzomilleto@mischas.com` | confirmado / não banido | producao | nunca logou |
| Bia | `biabuchmann@gmail.com` | confirmado / não banido | user + producao | 26/abr |

As contas existem e não estão banidas. As falhas registradas no Auth são `invalid_credentials`, então pelo menos algumas tentativas chegaram ao Supabase com senha incorreta.

Para funcionários, existe uma coluna `staff_accounts.senha_acesso`, mas a senha real usada no login fica no Supabase Auth como hash. Se a coluna foi editada ou se houve alguma diferença na criação, a senha visível pode não bater com a senha real.

## Correção proposta

### A. Destravar login imediatamente

1. Limpar ou neutralizar os registros recentes falhos de `auth_attempts` desses três emails/IP para remover o bloqueio atual.
2. Resetar a senha real no Supabase Auth para os funcionários:
   - Enzo: usar a senha salva em `staff_accounts.senha_acesso` (`senhaenzo`)
   - Bia: usar a senha salva em `staff_accounts.senha_acesso` (`senhabia`)
3. Resetar sua senha admin para uma senha temporária segura combinada no momento da implementação, ou criar uma tela/função de reset administrativo se você preferir não expor a senha no chat.

Observação: como estamos em modo plano, não consigo executar essas alterações agora. Após aprovar, eu faço as operações necessárias com segurança.

### B. Corrigir o rate limit para não bloquear usuários diferentes juntos

Alterar a função `check_rate_limit` para considerar email e IP de forma menos agressiva:

- Bloqueio por email: muitas falhas para o mesmo email continuam bloqueando aquele email.
- Bloqueio por IP: só bloquear IP em volume maior, para evitar ataque real, não 5 tentativas compartilhadas.
- Evitar que `127.0.0.1` cause bloqueio global para todos, porque no ambiente do preview ele não representa o IP real do usuário.

Regra sugerida:

```text
- máximo 5 falhas por email em 15 minutos
- máximo 30 falhas por IP em 15 minutos
- se IP for 127.0.0.1, priorizar bloqueio por email, não por IP compartilhado
```

Isso mantém proteção contra força bruta, mas evita travar todos os usuários quando várias pessoas erram senha no mesmo ambiente.

### C. Melhorar a mensagem de erro no login

Hoje o app pode mostrar erro genérico ou duplicar toast. Vou ajustar para ficar claro:

- Se bloqueou por tentativas: “Muitas tentativas. Aguarde alguns minutos ou fale com o administrador.”
- Se senha/email incorreto: “Email ou senha incorretos.”

### D. Ferramenta de manutenção para funcionários

Adicionar na tela de funcionários um botão/ação para **ressincronizar senha**:

- Pega a senha salva em `staff_accounts.senha_acesso`
- Atualiza a senha real no Supabase Auth via edge function existente `update-staff-password`
- Mostra confirmação de sucesso

Assim, se acontecer de novo, você resolve pela interface sem precisar mexer em banco.

## Arquivos / recursos envolvidos

### Banco

- Atualizar a função `public.check_rate_limit`
- Limpar/desbloquear tentativas recentes em `auth_attempts` para esses usuários

### Edge function

- Reutilizar `supabase/functions/update-staff-password/index.ts` para funcionários
- Se necessário, criar uma função administrativa pontual para reset do admin, protegida por service role/admin

### Frontend

- `src/contexts/AuthContext.tsx`
  - melhorar tratamento de rate limit e mensagens
- Lista de funcionários em configurações
  - adicionar botão “Ressincronizar senha” ou ação equivalente

## Resultado esperado

Depois da correção:

1. Você volta a conseguir logar.
2. Enzo entra com `enzomilleto@mischas.com` + a senha cadastrada para ele.
3. Bia entra com `biabuchmann@gmail.com` + a senha cadastrada para ela.
4. Erros de senha de um usuário não travam todos os outros.
5. Você terá uma ação simples para ressincronizar senha de funcionários no futuro.
