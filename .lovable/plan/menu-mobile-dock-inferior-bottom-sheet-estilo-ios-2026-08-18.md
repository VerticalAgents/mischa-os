# Menu mobile: dock inferior + bottom sheet estilo iOS

Substituir o hambúrguer + drawer lateral no mobile por uma barra de atalhos fixa no rodapé (dock) e um menu completo que sobe de baixo com rolagem fluida e fundo desfocado.

## Como vai funcionar

- Dock fixo no rodapé (só em telas < lg), com 5 slots:
  Início, Agendamento, Expedição, PCP e "Mais".
- Item ativo destacado (ícone + label em cor de destaque); os outros em tom neutro.
- Tocar em "Mais" abre um bottom sheet com todos os módulos permitidos, agrupados como hoje (Principal, Operacional, Tático, Estratégico, Sistema, Administração), em grade de 3 colunas com ícone + nome — igual à referência enviada.
- O sheet abre com mola suave, arrasta para baixo para fechar, tem a "alcinha" no topo, rola de forma contínua (momentum nativo) e o conteúdo atrás fica desfocado/escurecido.
- Rodapé do sheet com alternância de tema e "Sair".
- Navegar por qualquer item fecha o sheet automaticamente.
- O header mobile atual perde o hambúrguer (fica logo + alertas); a sidebar vermelha continua igual no desktop.

## Detalhes técnicos

- Novo `src/components/layout/MobileDock.tsx`: dock fixo `bottom-0 z-50 lg:hidden`, com `pb-[env(safe-area-inset-bottom)]`, fundo `bg-background/90 backdrop-blur-xl` e borda superior. Itens vêm de `mainMenuItems` já filtrados pelas permissões (mesma lógica de `SidebarContent`: `useUserRoles` + `useMyPermissions`).
- Novo `src/components/layout/MobileMenuSheet.tsx`: usa `@/components/ui/drawer` (Vaul) — já disponível — que entrega arrasto, mola e `overscroll` naturais. Área rolável com `overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch]` e `max-h-[85vh]`. Overlay com `backdrop-blur-sm bg-background/60` para o efeito esfumaçado.
- Grade de módulos com cards arredondados usando tokens semânticos (`bg-muted`, `text-muted-foreground`, ativo em `bg-accent text-accent-foreground`) — sem cores hardcoded.
- `AppLayout.tsx`: renderiza `MobileDock`, e adiciona `pb-20 lg:pb-0` no `main` para o conteúdo não ficar sob o dock. Estado do sheet fica no dock.
- `MobileHeader.tsx`: remove o botão hambúrguer e as props `isMobileMenuOpen`/`setIsMobileMenuOpen`; `SessionNavBar` deixa de receber props mobile (mantém comportamento desktop).
- Fechar o sheet ao mudar `location.pathname`.
- Verificação: Playwright em viewport 390x844 para conferir dock, abertura do sheet, blur e rolagem.

Se preferir outros 4 atalhos no dock (ex.: Clientes ou Estoque no lugar de PCP), é só dizer e eu ajusto.
