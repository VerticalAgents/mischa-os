
# Plano: Reorganizar Menu de Configurações com Sidebar Lateral

## Objetivo

Substituir o layout atual de "tabs empilhadas por categoria" (que ocupa muito espaço vertical) por uma estrutura de **sidebar fixa à esquerda + conteúdo à direita**, similar ao padrão já utilizado na página `/manual`.

## Comparação Visual

| Antes | Depois |
|-------|--------|
| Menu de tabs horizontais dentro de Card | Sidebar fixa de ~280px à esquerda |
| Categorias empilhadas verticalmente | Categorias como grupos expansíveis na sidebar |
| Ocupa ~50% da tela só com navegação | Navegação compacta, conteúdo ocupa área principal |

## O Que Será Criado/Modificado

### 1. Novo Componente: `ConfiguracoesNavigation.tsx`
Sidebar de navegação inspirada no `ManualNavigation.tsx`:
- Largura fixa de ~280px
- Categorias como seções (Administração, Financeiro, etc.)
- Itens clicáveis dentro de cada categoria
- Indicador visual do item ativo
- Scroll interno para muitos itens

### 2. Modificar: `ConfiguracoesTabs.tsx`
Substituir o layout de tabs por:
- Estrutura flex com sidebar + conteúdo
- Usar o novo `ConfiguracoesNavigation` para navegação
- Manter a lógica de persistência de tab ativa

### 3. Modificar: `Configuracoes.tsx`
Ajustar layout para comportar a nova estrutura full-height similar ao Manual

---

## Layout Proposto

```text
┌──────────────────────────────────────────────────────────────────┐
│ Header: Configurações                                            │
├───────────────┬──────────────────────────────────────────────────┤
│               │                                                  │
│  SIDEBAR      │   CONTEÚDO DA ABA SELECIONADA                   │
│  (fixa)       │                                                  │
│               │                                                  │
│ ┌───────────┐ │   ┌──────────────────────────────────────────┐  │
│ │ADMINISTR. │ │   │  Dados da Empresa                        │  │
│ │ • Empresa │ │   │  Configure as informações básicas...     │  │
│ │ • Usuário │ │   │                                          │  │
│ │ • Sistema │ │   │  [Form fields...]                        │  │
│ │ • Agentes │ │   │                                          │  │
│ ├───────────┤ │   └──────────────────────────────────────────┘  │
│ │FINANCEIRO │ │                                                  │
│ │ • Parâm.  │ │                                                  │
│ │ • Precif. │ │                                                  │
│ │ ...       │ │                                                  │
│ └───────────┘ │                                                  │
│               │                                                  │
└───────────────┴──────────────────────────────────────────────────┘
```

---

## Arquivos a Criar/Modificar

| Arquivo | Ação |
|---------|------|
| `src/components/configuracoes/ConfiguracoesNavigation.tsx` | **CRIAR** - Sidebar de navegação |
| `src/components/configuracoes/ConfiguracoesTabs.tsx` | Refatorar para layout sidebar + conteúdo |
| `src/pages/Configuracoes.tsx` | Ajustar estrutura de layout |

---

## Seção Técnica

### ConfiguracoesNavigation.tsx (Novo)

```typescript
interface ConfiguracoesNavigationProps {
  currentTab: string;
  onTabChange: (tabId: string) => void;
}
```

Componentes internos:
- `ScrollArea` para scroll vertical
- Seções por categoria com título em uppercase (muted)
- Botões de navegação com estado active/hover
- Ícones opcionais por categoria

### ConfiguracoesTabs.tsx (Refatorado)

Mudança principal:
```typescript
// DE (atual):
<Tabs>
  <Card com TabsList empilhados>
  <TabsContent>

// PARA (novo):
<div className="flex h-full">
  <ConfiguracoesNavigation 
    currentTab={activeTab}
    onTabChange={changeTab}
  />
  <div className="flex-1 overflow-auto p-6">
    {/* Renderiza componente da aba ativa */}
    <ActiveTabComponent />
  </div>
</div>
```

### Persistência de Estado

Mantém o `useTabPersistence` existente - apenas muda a UI de navegação, não a lógica de estado.

### Responsividade

Para telas menores (mobile), a sidebar pode:
- Ficar oculta com botão toggle
- Ou manter versão compacta com apenas ícones

---

## Benefícios

1. **Menos espaço desperdiçado** - Navegação compacta na lateral
2. **Padrão consistente** - Similar ao Manual de Instruções
3. **Melhor UX** - Categorias sempre visíveis sem scroll
4. **Escalável** - Fácil adicionar novos itens sem poluir a interface
