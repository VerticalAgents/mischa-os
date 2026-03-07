

# Adicionar modulo Cross "Faturamento" e botao Exportar Markdown

## Alteracoes em `src/pages/Modulos.tsx`

### 1. Novo modulo cross-module: Faturamento & Pagamentos

Adicionar um segundo card cross-module (similar ao da Mischa IA) representando o modulo de **Faturamento & Pagamentos** (NF-e, boletos, PIX). Visualmente tera o mesmo estilo amber/cross-module, posicionado logo abaixo do card da Mischa IA.

O card mostrara:
- Icone `Receipt` (lucide)
- Nome: "Faturamento & Pagamentos"
- Descricao: emissao de NF-e, geracao de boletos, PIX e gestao de recebimentos
- 3 sub-cards por tier mostrando como escala (Tier 1: NF-e e boleto basico; Tier 2: + conciliacao e cobranca automatica; Tier 3: + relatorios financeiros integrados)

Tambem adicionar esse modulo na matriz de dependencias com badge Cross-Module.

### 2. Botao "Exportar Markdown" no header

Adicionar um botao no topo da pagina (ao lado do titulo) que gera e baixa um arquivo `.md` com toda a estrutura de modulos:
- Titulo e descricao
- Secao de modulos cross-module (Mischa IA + Faturamento)
- Tabela por tier com nome, descricao e dependencias
- Secao de estrategia de upsell
- Matriz de dependencias completa

A funcao criara o conteudo markdown como string e usara `Blob` + `URL.createObjectURL` + link temporario para download.

### Icones adicionais importados
- `Receipt` e `Download` do lucide-react

