
# Plano: Corrigir Sidebar Travando em Estado Intermediário

## Problema Diagnosticado

A sidebar às vezes fica "travada" aberta (largura expandida) mas sem mostrar os textos/títulos. Quando o mouse passa por cima novamente, ela volta ao normal.

### Causa raiz
Os eventos `onMouseEnter`/`onMouseLeave` do React são conhecidamente inconsistentes quando:
- O usuário move o mouse rapidamente para fora
- Há elementos filhos com scroll interno (ScrollArea)
- Modais, popovers ou tooltips capturam o foco do mouse temporariamente

Quando `onMouseLeave` não é disparado, o estado `isCollapsed` permanece `false`, mas a animação Framer Motion pode estar em um estado intermediário.

---

## Solução Proposta

Substituir os eventos `onMouseEnter`/`onMouseLeave` pelo sistema nativo do Framer Motion: **`onHoverStart`/`onHoverEnd`** + **`whileHover`**.

Esses eventos são mais confiáveis porque:
1. São tratados diretamente pelo Framer Motion com detecção de borda mais precisa
2. Incluem fallback automático para casos de transições rápidas
3. Funcionam melhor com animações assíncronas

### Implementação adicional de segurança
Adicionar um listener global de `mousemove` como fallback que verifica se o mouse realmente saiu da sidebar, forçando o estado correto.

---

## Alterações Técnicas

### Arquivo: `src/components/ui/sidebar-next.tsx`

#### 1. Adicionar useRef para referência do elemento
```typescript
import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
```

#### 2. Criar ref e callback de verificação
```typescript
const sidebarRef = useRef<HTMLDivElement>(null);

// Fallback: verificar periodicamente se o mouse realmente saiu
const checkMousePosition = useCallback((e: MouseEvent) => {
  if (sidebarRef.current && !isCollapsed) {
    const rect = sidebarRef.current.getBoundingClientRect();
    const isInside = 
      e.clientX >= rect.left && 
      e.clientX <= rect.right && 
      e.clientY >= rect.top && 
      e.clientY <= rect.bottom;
    
    if (!isInside) {
      setIsCollapsed(true);
    }
  }
}, [isCollapsed]);

// Adicionar/remover listener de fallback
useEffect(() => {
  if (!isCollapsed) {
    // Verificar posição do mouse com debounce
    const handler = (e: MouseEvent) => checkMousePosition(e);
    document.addEventListener('mousemove', handler);
    return () => document.removeEventListener('mousemove', handler);
  }
}, [isCollapsed, checkMousePosition]);
```

#### 3. Substituir onMouseEnter/onMouseLeave por onHoverStart/onHoverEnd
```tsx
<motion.div 
  ref={sidebarRef}
  className={cn("sidebar fixed left-0 z-40 h-full shrink-0 border-r")} 
  style={{ backgroundColor: '#d1193a', borderColor: 'rgba(255,255,255,0.2)' }}
  initial="closed"
  animate={isCollapsed ? "closed" : "open"} 
  variants={sidebarVariants} 
  transition={transitionProps}
  onHoverStart={() => setIsCollapsed(false)}
  onHoverEnd={() => setIsCollapsed(true)}
>
```

#### 4. (Opcional) Remover classe `fixed` duplicada
Na linha atual:
```tsx
className={cn("sidebar fixed left-0 z-40 h-full shrink-0 border-r fixed")}
```
A palavra `fixed` aparece duas vezes - corrigir para:
```tsx
className={cn("sidebar fixed left-0 z-40 h-full shrink-0 border-r")}
```

---

## Por que isso funciona

```text
Antes (problema):
┌─────────────────────────────────────────────────────────────┐
│  onMouseEnter/Leave  →  Evento DOM nativo                  │
│         ↓                                                    │
│  Mouse sai rápido    →  Evento pode não disparar           │
│         ↓                                                    │
│  isCollapsed = false →  Sidebar travada aberta             │
└─────────────────────────────────────────────────────────────┘

Depois (solução):
┌─────────────────────────────────────────────────────────────┐
│  onHoverStart/End    →  Evento Framer Motion (mais robusto)│
│         +                                                    │
│  mousemove fallback  →  Verifica posição real do mouse     │
│         ↓                                                    │
│  Estado sempre sync  →  Sidebar nunca fica travada         │
└─────────────────────────────────────────────────────────────┘
```

---

## Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/ui/sidebar-next.tsx` | Trocar eventos de mouse, adicionar ref, adicionar fallback de verificação |

---

## Checklist de Validação

1. Mover o mouse rapidamente para dentro e fora da sidebar
2. Passar o mouse sobre a sidebar enquanto há um modal aberto
3. Mover o mouse para fora da sidebar pelo topo/bottom (não apenas lateralmente)
4. Verificar se a sidebar expande suavemente e colapsa corretamente
5. Testar com scroll ativo dentro da sidebar
