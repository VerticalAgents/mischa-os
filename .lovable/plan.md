
# Plano: Adicionar Botão de Download de Formulário de Cadastro de Cliente

## Objetivo
Adicionar um botão ao lado de "Sincronizar com Gestão Click" que permite baixar um formulário/planilha Excel para cadastro de novos clientes. Este formulário será enviado aos vendedores para preencherem com dados de novos clientes.

---

## Alterações Necessárias

### Arquivo: `src/pages/Clientes.tsx`

#### 1. Adicionar import do ícone
```text
Adicionar: FileDown (ou Download) de lucide-react
```

#### 2. Criar função de download do formulário
```text
const handleDownloadFormularioCadastro = () => {
  // Criar planilha Excel com headers formatados
  // Campos incluídos no formulário
}
```

#### 3. Adicionar botão no PageHeader
```text
Posição: Ao lado do botão "Sincronizar com Gestão Click"
Texto: "Formulário Cadastro"
Ícone: FileDown ou Download
Ação: Baixar arquivo Excel/CSV
```

---

## Campos do Formulário de Cadastro

O formulário incluirá os seguintes campos com colunas pré-formatadas:

| Coluna | Descrição | Exemplo |
|--------|-----------|---------|
| Nome Fantasia | Nome comercial do cliente | FIGUEIRA 6 (Águas Claras) |
| Razão Social | Nome jurídico completo | POSTO DE COMBUSTÍVEIS LTDA |
| Tipo Pessoa | PF ou PJ | PJ |
| CNPJ/CPF | Documento (formatado ou não) | 17.354.868/0001-92 |
| Inscrição Estadual | IE (apenas PJ) | 159/0249809 |
| Endereço Completo | Logradouro, número, bairro, cidade, UF, CEP | Rodovia RS 040, 17800 - Viamão/RS |
| Nome do Contato | Responsável pelo ponto | João Silva |
| Telefone | Número com DDD | (51) 99999-9999 |
| Email | Email de contato | contato@exemplo.com |
| Observações | Informações adicionais | Horário de entrega: manhã |

---

## Formato do Arquivo

- **Tipo**: CSV (compatível com Excel e Google Sheets)
- **Nome**: `formulario_cadastro_clientes.csv`
- **Encoding**: UTF-8 com BOM (para suportar acentos no Excel)
- **Conteúdo**: Cabeçalhos + 1 linha de exemplo preenchida + linhas em branco para novos cadastros

---

## Layout dos Botões

```text
[Novo Cliente] [Sincronizar com Gestão Click] [Formulário Cadastro] [Revisão Clientes]
```

---

## Detalhes Técnicos

### Implementação da função de download

```typescript
const handleDownloadFormularioCadastro = () => {
  // Headers do formulário
  const headers = [
    'Nome Fantasia',
    'Razão Social', 
    'Tipo Pessoa (PF/PJ)',
    'CNPJ ou CPF',
    'Inscrição Estadual',
    'Endereço Completo',
    'Nome do Contato',
    'Telefone',
    'Email',
    'Observações'
  ];

  // Linha de exemplo para orientar preenchimento
  const exemploLinha = [
    'NOME DO CLIENTE',
    'RAZÃO SOCIAL COMPLETA LTDA',
    'PJ',
    '00.000.000/0001-00',
    '000/0000000',
    'Rua Exemplo, 123 - Bairro - Cidade/RS - CEP 00000-000',
    'Nome do Responsável',
    '(51) 99999-9999',
    'email@exemplo.com',
    ''
  ];

  // Criar CSV com BOM para UTF-8
  const BOM = '\uFEFF';
  const csvContent = BOM + headers.join(';') + '\n' + exemploLinha.join(';');

  // Criar e baixar arquivo
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = 'formulario_cadastro_clientes.csv';
  link.click();
  
  toast.success('Formulário de cadastro baixado!');
};
```

---

## Resultado Esperado

1. Novo botão "Formulário Cadastro" visível na página de Clientes
2. Ao clicar, baixa um arquivo CSV com:
   - Cabeçalhos formatados em português
   - Uma linha de exemplo para orientação
   - Pronto para ser aberto no Excel ou Google Sheets
3. Vendedores preenchem o formulário e enviam de volta
4. Facilita a inserção de dados no sistema
