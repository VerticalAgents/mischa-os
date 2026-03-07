
## Adicionar botão "Copiar Markdown" na página Modulos

### Objetivo
Criar um segundo botão no header da página que copie o conteúdo markdown para a área de transferência, permitindo ao usuário colar em chats, documentos Word ou outras aplicações.

### Implementação

#### Mudanças em `src/pages/Modulos.tsx`:

1. **Importar `Copy` e `Check` do lucide-react** (já existem, apenas usar):
   - `Copy` para o ícone do botão
   - `Check` para feedback visual após copiar

2. **Adicionar estado para feedback**:
   - Novo estado `const [copiado, setCopiado] = useState(false);` para controlar o feedback visual

3. **Criar função `copyMarkdownToClipboard()`**:
   - Gera o markdown com `generateMarkdown()`
   - Usa `navigator.clipboard.writeText()` para copiar para a área de transferência
   - Mostra feedback visual: botão muda para "Copiado!" com ícone `Check` por 2 segundos
   - Trata erros com try/catch e exibe toast se necessário

4. **Adicionar botão no header**:
   - Posicionar ao lado do botão "Exportar Markdown" existente
   - Usar layout flex com gap entre os botões
   - Mesmo tamanho e variant (`size="sm"`, `variant="outline"`)
   - Texto e ícone muda dinamicamente baseado no estado `copiado`

#### Estrutura do header atualizado:
```
<div className="flex items-center justify-between">
  <div> ... título e descrição ... </div>
  <div className="flex gap-2">
    <Button onClick={copyMarkdownToClipboard}> ... Copiar Markdown ... </Button>
    <Button onClick={exportMarkdown}> ... Exportar Markdown ... </Button>
  </div>
</div>
```

#### Imports adicionais:
- `Check` já está em use, nenhum novo import necessário

### User Experience
- Botão "Copiar Markdown" com ícone `Copy`
- Ao clicar: texto é copiado, botão muda para "Copiado!" com ícone `Check`
- Após 2 segundos: botão volta ao estado original
- Funciona offline, sem necessidade de download
