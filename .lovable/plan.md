
# Plano: Adicionar Filtro de Busca por Nome no Dashboard de Agendamentos

## Objetivo
Adicionar um campo de busca por texto que permite filtrar os agendamentos pelo nome do cliente, integrado à barra de filtros existente.

---

## Interface Visual Proposta

A barra de filtros atual:
```
[Filtros] [Navegador Semana] [Representantes ▼] [Rotas ▼] [Exportar PDF]
```

Nova barra de filtros:
```
[Filtros] [🔍 Buscar cliente...] [Navegador Semana] [Representantes ▼] [Rotas ▼] [Exportar PDF]
```

### Comportamento do Campo de Busca
- Busca em tempo real enquanto digita (debounce não necessário para listas pequenas)
- Busca case-insensitive (ignora maiúsculas/minúsculas)
- Limpa o filtro quando o campo está vazio
- Placeholder: "Buscar cliente..."
- Ícone de Search (lupa) à esquerda

---

## Alterações Técnicas

### 1. Novo Estado para Filtro de Texto
```typescript
const [filtroNome, setFiltroNome] = useState<string>('');
```

### 2. Atualizar useMemo de agendamentosFiltrados

Adicionar filtragem por nome do cliente:
```typescript
const agendamentosFiltrados = useMemo(() => {
  let filtrados = agendamentos;
  
  // Filtro por nome do cliente (NOVO)
  if (filtroNome.trim()) {
    const termoBusca = filtroNome.toLowerCase().trim();
    filtrados = filtrados.filter(agendamento => 
      agendamento.cliente.nome.toLowerCase().includes(termoBusca)
    );
  }
  
  // Filtro por representante (existente)
  if (representanteFiltro.length > 0) {
    filtrados = filtrados.filter(agendamento => 
      agendamento.cliente.representanteId && 
      representanteFiltro.includes(agendamento.cliente.representanteId)
    );
  }
  
  // Filtro por rota (existente)
  if (rotaFiltro.length > 0) {
    filtrados = filtrados.filter(agendamento => 
      agendamento.cliente.rotaEntregaId && 
      rotaFiltro.includes(agendamento.cliente.rotaEntregaId)
    );
  }
  
  return filtrados;
}, [agendamentos, filtroNome, representanteFiltro, rotaFiltro]);
```

### 3. Adicionar Campo de Input na Barra de Filtros

Inserir entre o label "Filtros" e o navegador de semana:
```tsx
<div className="relative">
  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
  <Input
    placeholder="Buscar cliente..."
    value={filtroNome}
    onChange={(e) => setFiltroNome(e.target.value)}
    className="pl-8 h-9 w-48"
  />
</div>
```

### 4. Atualizar Contador de Filtros Ativos

Incluir filtroNome na contagem:
```tsx
{(representanteFiltro.length > 0 || rotaFiltro.length > 0 || filtroNome.trim()) && (
  <Badge variant="secondary" className="text-xs">
    {[
      representanteFiltro.length > 0, 
      rotaFiltro.length > 0,
      filtroNome.trim().length > 0
    ].filter(Boolean).length} ativo(s)
  </Badge>
)}
```

---

## Arquivo a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/agendamento/AgendamentoDashboard.tsx` | Adicionar estado filtroNome, Input de busca e lógica de filtragem |

---

## Imports Necessários

Adicionar aos imports existentes:
```typescript
import { Search } from "lucide-react"; // já existe no projeto
import { Input } from "@/components/ui/input";
```

---

## Fluxo de Dados

```text
Usuario digita "Luzardo"
        │
        ▼
filtroNome = "Luzardo"
        │
        ▼
useMemo(agendamentosFiltrados)
        │
        ├── Filtra por nome.toLowerCase().includes("luzardo")
        ├── Filtra por representante (se ativo)
        └── Filtra por rota (se ativo)
        │
        ▼
Componentes atualizam com lista filtrada
```

---

## Resultado Esperado

1. **Campo de busca** posicionado na barra de filtros, após o label "Filtros"
2. **Busca instantânea** enquanto digita
3. **Case-insensitive** para facilitar uso
4. **Integração** com filtros existentes (representante e rota)
5. **Contador atualizado** para incluir filtro de nome quando ativo
6. **Layout responsivo** com largura fixa de 192px (w-48)

---

## Benefícios

1. **Localização rápida**: Encontrar clientes específicos em listas grandes
2. **Eficiência operacional**: Menos scroll e procura manual
3. **Consistência**: Mesmo padrão de busca usado em outras telas (Clientes)
4. **Não-invasivo**: Não altera lógica existente, apenas adiciona camada de filtro
