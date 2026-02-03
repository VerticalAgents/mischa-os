
## Diagnóstico (por que “às vezes” volta para o login antigo)

Hoje existem **duas páginas de login diferentes** no app:

- **`/auth`** → `src/pages/auth/AuthPage.tsx`  
  (novo login personalizado: fundo vermelho `#d1193a`, logo da Mischa’s, cadastro bloqueado)

- **`/login`** → `src/pages/auth/LoginPage.tsx`  
  (login antigo: ícone roxo, layout claro, abas com cadastro e **botão “Entrar com Google”** — exatamente o da sua imagem)

E o app **ainda redireciona para `/login` em alguns fluxos**, por isso parece “intermitente”:

1) **Quando você abre uma rota protegida direto (ex: `/clientes`) sem estar logado**  
   `ProtectedRoute` manda para **`/login`**:
   - arquivo: `src/components/auth/ProtectedRoute.tsx` (`<Navigate to="/login" ... />`)

2) **Quando faz logout**  
   `AuthContext` manda para **`/login`**:
   - arquivo: `src/contexts/AuthContext.tsx` (`navigate('/login')`)

3) **Se a renovação de sessão falhar**  
   `SessionExpiredDialog` manda para **`/login`**:
   - arquivo: `src/components/common/SessionExpiredDialog.tsx` (`window.location.href = '/login'`)

Então “às vezes” = depende do caminho que o usuário tomou (entrar pelo link raiz vs entrar por uma página interna, logout, sessão expirada, etc.).

---

## Solução definitiva (nunca mais existir “design antigo”)

Objetivo: **garantir que `/login` e `/auth` exibam exatamente o MESMO login personalizado**, e padronizar todos os redirecionamentos para um único caminho.

### Estratégia
1) **Eliminar a UI antiga** transformando `LoginPage.tsx` em um “alias” do `AuthPage` (ou seja, `/login` passa a renderizar o mesmo componente personalizado).
2) **Padronizar redirecionamentos** para mandar sempre para o login personalizado (vamos escolher **`/auth` como canônico**), mantendo `/login` apenas como compatibilidade/atalho.
3) Ajustar todos os pontos hardcoded que mandam para `/login`.

---

## Mudanças planejadas (arquivos e o que será feito)

### 1) `src/pages/auth/LoginPage.tsx` (principal)
- Remover o layout antigo inteiro (ícone roxo, Google, cadastro, etc.).
- Substituir por um wrapper simples que **renderiza o mesmo login personalizado**:
  - Opção preferida: `export default function LoginPage(){ return <AuthPage /> }`
  - (assim, qualquer acesso a `/login` já mostra o design novo imediatamente)

Resultado: **não existe mais como “aparecer o antigo”**, porque o JSX antigo deixa de existir.

### 2) `src/components/auth/ProtectedRoute.tsx`
- Trocar o redirect de `"/login"` para `"/auth"`.
- Isso garante que ao tentar acessar `/clientes` sem login, o usuário cai sempre no login novo.

### 3) `src/contexts/AuthContext.tsx`
- No evento `SIGNED_OUT`, trocar `navigate('/login')` por `navigate('/auth')`.
- Assim, após logout, sempre volta ao login personalizado.

### 4) `src/components/common/SessionExpiredDialog.tsx`
- Trocar `window.location.href = '/login'` por `'/auth'`.

### 5) (Opcional, mas recomendado) `src/App.tsx`
- Manter as duas rotas (`/auth` e `/login`) por compatibilidade, porém ambas levam ao mesmo login (via wrapper).
- Alternativa opcional: fazer `/login` virar um `<Navigate to="/auth" replace />` (mas o wrapper já resolve e é mais simples).

### 6) (Higienização opcional) listas de rotas excluídas
Arquivos:
- `src/hooks/useRoutePersistence.ts`
- `src/hooks/useRouteProtection.ts`
- `src/pages/Index.tsx`

Esses lugares têm arrays com `'/auth'` e `'/login'`.  
Não é a causa do problema, mas após padronizar, podemos:
- manter `/login` na lista (ok, pois ainda é uma rota “de login/atalho”), ou
- simplificar para uma única rota canônica.

---

## Como vamos validar (checklist de testes)
1) Abrir **`/auth`** no link publicado → deve mostrar login vermelho personalizado.
2) Abrir **`/login`** no link publicado → deve mostrar **o mesmo** login personalizado (e nunca o roxo).
3) Abrir um link interno direto sem estar logado (ex: **`/clientes`**) → deve redirecionar para o login personalizado (não para o antigo).
4) Fazer logout → deve voltar para o login personalizado.
5) Testar em aba anônima + celular (Safari/Chrome) para garantir que não existe “volta” visual.

---

## Observação importante (cache)
Mesmo após a correção, quando você publicar, recomendo validar com:
- hard refresh (Ctrl+Shift+R) e/ou aba anônima,
porque o browser pode manter arquivos antigos em cache.  
Mas com a mudança acima, mesmo que alguém acesse `/login`, **a página antiga não existe mais no código**, então o “fallback” para o design roxo deixa de acontecer.

---

## Próximas sugestões (opcionais, depois que isso estiver resolvido)
1) Testar o fluxo de login end-to-end no link publicado (inclusive acessando uma rota protegida diretamente).
2) Implementar “voltar para a página que eu tentei acessar” após login (usar `location.state.from`).
3) Padronizar de vez a URL de login (escolher só `/login` ou só `/auth`) e redirecionar a outra permanentemente.
4) Adicionar um pequeno “build version banner” em dev para detectar quando a publicação não atualizou.
5) Auditoria rápida: remover referências antigas a “Google login” para reduzir confusão e superfície de manutenção.
