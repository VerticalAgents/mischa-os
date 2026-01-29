

# Plano: Ajustar UI dos Filtros e Cores do Card

## Objetivo
1. Reorganizar os filtros da aba Separação para seguir o mesmo padrão visual da aba "Entregas Pendentes"
2. Alterar a cor do destaque no card "Produtos Necessários" de amarelo para azul

---

## 1. Ajustes no SeparacaoFilters.tsx

### Layout Atual
```
+----------------------------------------------------------+
| Filtros [badge]                             X pedidos    |
+----------------------------------------------------------+
| [Busca]   [Tipo Pedido]   [Dia/Semana] [DataPicker/Nav]  |
+----------------------------------------------------------+
| Representante: [Filtro de Representantes]                |
+----------------------------------------------------------+
```

### Novo Layout (igual DespachoFilters)
```
+----------------------------------------------------------+
| Filtros [badge]                             X pedidos    |
+----------------------------------------------------------+
| [Busca]    [Tipo Pedido]    [Representante]              |
+----------------------------------------------------------+
| [Dia/Semana Toggle]  [Data picker ou WeekNavigator]      |
+----------------------------------------------------------+
```

**Alteracoes:**
- Grid de 3 colunas para busca, tipo e representante
- Linha separada para o seletor de periodo (dia/semana)
- Remover o texto "Representante:" e mover para a mesma linha dos outros filtros

---

## 2. Alteracao de Cor no ResumoQuantidadeProdutos.tsx

### Atual (Amarelo - usando primary)
```css
bg-primary/10 dark:bg-primary/20 border-primary/20
text-primary
```

### Novo (Azul)
```css
bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800
text-blue-600 dark:text-blue-400
```

**Elementos afetados:**
- Bloco de destaque "Quantidade Total Necessaria"
- Numero grande do total
- Badge de quantidade de pedidos

---

## Arquivos a Modificar

| Arquivo | Acao |
|---------|------|
| `src/components/expedicao/components/SeparacaoFilters.tsx` | Reorganizar layout dos filtros |
| `src/components/expedicao/components/ResumoQuantidadeProdutos.tsx` | Alterar cores de amarelo para azul |

---

## Resultado Visual Esperado

### Card Produtos Necessarios (Nova cor)
```
+--------------------------------+
| Produtos Necessarios           |
| Quantidades para pedidos       |
+--------------------------------+
| [Bloco Azul]                   |
| Quantidade Total Necessaria    |
| 893 (texto azul)               |
| [25 pedidos] badge azul        |
+--------------------------------+
```

### Filtros (Novo layout)
```
+--------------------------------+
| Filtros [1 ativo] | X pedidos  |
+--------------------------------+
| [Busca] | [Tipo] | [Repres.]  |
+--------------------------------+
| [Dia|Semana]  [Navigator/Date] |
+--------------------------------+
```

