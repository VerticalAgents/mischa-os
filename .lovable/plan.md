
# Plano: Corrigir Ícone Cortado na Barra Lateral Minimizada

## Problema Identificado

A imagem do gato está sendo cortada porque há múltiplas camadas de padding que reduzem o espaço útil:

```text
Largura total: 3.5rem (56px)
├── Container externo: p-2 (8px cada lado) = 40px restantes
│   └── Container interno: px-2 (8px cada lado) = 24px restantes
│       └── Imagem: size-8 (32px) ← NÃO CABE!
```

## Solução

Aumentar a largura minimizada para `4rem` (64px) e ajustar o padding interno para centralizar melhor a imagem.

---

## Alterações

### 1. Aumentar Largura Minimizada
```typescript
const sidebarVariants = {
  open: {
    width: "15rem"
  },
  closed: {
    width: "4rem"  // Aumentar de 3.5rem para 4rem (64px)
  }
};
```

### 2. Ajustar Padding do Header
Reduzir o padding horizontal interno quando minimizado:
```tsx
<div className="flex w-full items-center gap-2 px-2">
// Mudar para:
<div className={cn(
  "flex w-full items-center gap-2",
  isCollapsed ? "justify-center px-0" : "px-2"
)}>
```

### 3. Centralizar Imagem Quando Minimizado
```tsx
<img 
  src={mischasLogo} 
  className={cn(
    "object-cover rounded-full border-2 border-white shrink-0",
    isCollapsed ? "size-10" : "size-8"  // Imagem maior quando minimizado
  )}
  alt="Mischa's Bakery Logo" 
/>
```

---

## Arquivo a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/ui/sidebar-next.tsx` | Largura 4rem, ajustar padding, centralizar imagem |

---

## Resultado Visual

```text
Minimizado (4rem = 64px):
+----------------+
|                |
|    [🐱 Logo]   |  ← Centralizado, sem corte
|                |
|     [📊]       |  ← Ícones centralizados
|     [📋]       |
|     [🚚]       |
+----------------+

Expandido (15rem):
+----------------------------------+
|  [🐱]  MISCHA'S BAKERY           |
|                                  |
|  • Dashboard                     |
|  • Agendamentos                  |
|  • Clientes                      |
+----------------------------------+
```
