# Detalhes do Cliente para Representante

Hoje, em `/rep/clientes`, o representante vê uma tabela e só consegue **editar** o cliente. Vamos transformar o clique no bloco/linha do cliente numa **visualização detalhada com abas** — a mesma usada pelo admin (Informações, Agendamento Atual, Análise de Giro, Financeiro, Histórico de Entregas).

## O que muda

**Página `src/pages/rep/RepClientes.tsx`**
- Adicionar estado `clienteSelecionado: Cliente | null`.
- Tornar a linha da tabela clicável (cursor pointer + hover já existente). O ícone de lápis (Editar) continua funcionando, mas o clique no restante da linha abre os detalhes.
- Quando há cliente selecionado, renderizar `<ClienteDetailsView cliente={...} onBack={() => setClienteSelecionado(null)} />` em vez da lista.
- Buscar o registro completo do cliente (igual ao `handleEditar` atual) e converter via `transformDbRowToCliente` antes de abrir os detalhes.

**Reuso de componentes existentes (sem duplicar código):**
- `ClienteDetailsView` → já renderiza `PageHeader` + botão Editar + `ClienteDetalhesTabs`.
- `ClienteDetalhesTabs` → já contém as 5 abas: Informações, Agendamento Atual, Análise de Giro, Financeiro, Histórico de Entregas.
- O botão "Editar Cliente" dentro do `ClienteDetailsView` depende de `useEditPermission().canEdit`. Para o representante, vamos envolver a visualização num `EditPermissionProvider` com `canEdit={true}` (representante já pode editar seus clientes hoje, conforme RLS atual).

## Considerações

- **RLS**: as tabelas consultadas pelas abas (agendamentos, entregas, giro, financeiro, preços por categoria) já têm policies que permitem ao representante ver dados dos seus clientes (confirmado nos ajustes anteriores de RLS).
- **Layout**: o `RepLayout` já usa container centralizado (`max-w-6xl`). O `ClienteDetailsView` se adapta bem a essa largura.
- **Voltar**: o botão "Voltar para lista" do `PageHeader` chama `onBack`, que limpa o cliente selecionado e mostra novamente a tabela com filtros preservados (estado mantido no componente pai).
- **Aviso GestaoClick**: já foi escondido para representantes na resposta anterior, então segue oculto nas Informações.

## Detalhes técnicos

```tsx
// RepClientes.tsx (resumo)
const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);

const abrirDetalhes = async (id: string) => {
  const { data } = await supabase.from("clientes").select("*").eq("id", id).maybeSingle();
  if (data) setClienteSelecionado(transformDbRowToCliente(data));
};

if (clienteSelecionado) {
  return (
    <EditPermissionProvider value={{ canEdit: true }}>
      <ClienteDetailsView
        cliente={clienteSelecionado}
        onBack={() => { setClienteSelecionado(null); carregar(); }}
      />
    </EditPermissionProvider>
  );
}

// na tabela:
<tr onClick={() => abrirDetalhes(c.id)} className="border-t hover:bg-muted/30 cursor-pointer">
  ...
  <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
    <Button onClick={() => handleEditar(c.id)}>...</Button>
  </td>
</tr>
```

Nenhuma migração de banco é necessária — apenas alterações no frontend.
