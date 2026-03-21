

## Plano: Unificar sidebar e otimizar mobile

### Problema atual
Existem **duas navegações laterais** independentes:
1. **Sidebar vermelha** (`SessionNavBar`) — fixa, expande com hover, visível em todas as telas
2. **Menu branco** (`MobileMenuOverlay`) — abre via hamburger, só no mobile/tablet

No mobile/tablet, a sidebar vermelha fica colapsada (ícones) mas o hover não funciona em touch. O hamburger abre o menu branco duplicado.

### Solução

**Eliminar o `MobileMenuOverlay` e fazer o hamburger controlar a sidebar vermelha.**

### Mudanças

**1. `SessionNavBar` — aceitar controle externo (mobile toggle)**
- Adicionar prop `mobileOpen` + `onMobileClose` para controle externo
- No mobile/tablet (`lg:hidden`): sidebar fica **totalmente escondida** (não mostra ícones), e abre expandida quando `mobileOpen=true`
- No desktop (`lg+`): mantém comportamento atual (hover para expandir/colapsar)
- Quando aberta no mobile, mostrar overlay backdrop clicável para fechar

**2. `MobileHeader` — controlar a sidebar vermelha**
- Remover referência ao `MobileMenuOverlay`
- Hamburger agora chama `setIsMobileMenuOpen(true)` que passa para `SessionNavBar`

**3. `AppLayout` — remover `MobileMenuOverlay`**
- Remover import e renderização do `MobileMenuOverlay`
- Passar `isMobileMenuOpen` / `setIsMobileMenuOpen` para `SessionNavBar`
- No mobile: remover `ml-[3.05rem]` do main (sidebar escondida, não ocupa espaço)

**4. `Home.tsx` — otimizar layout mobile**
- Cards de ações rápidas: `grid-cols-2` no mobile já existe, ok
- Seção Sistema: usar `grid-cols-2` no mobile em vez de `grid-cols-1`
- Reduzir padding/gaps em telas pequenas

**5. Remover `MobileMenuOverlay.tsx`** — arquivo não mais necessário

### Arquivos alterados
- `src/components/ui/sidebar-next.tsx` — lógica mobile toggle
- `src/components/layout/AppLayout.tsx` — remover overlay, passar props
- `src/components/layout/MobileHeader.tsx` — sem mudança funcional (já controla o state)
- `src/pages/Home.tsx` — ajustes responsivos menores
- `src/components/layout/MobileMenuOverlay.tsx` — deletar

