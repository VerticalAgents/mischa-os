import { describe, expect, it } from "vitest";
import { montarEtiquetasPedido, somarDias } from "./pacotesEtiqueta";

const HOJE = new Date(2026, 9, 9); // 09/10/2026

describe("montarEtiquetasPedido", () => {
  it("tira o nano do saco de brownie e dá uma etiqueta para cada pacote", () => {
    const etiquetas = montarEtiquetasPedido(
      "REDEVIP24H (Aeroporto)",
      [
        { nome: "Brownie Choco Duo", quantidade: 18 },
        { nome: "Brownie Avelã", quantidade: 16 },
        { nome: "Brownie Stikadinho", quantidade: 6 },
        { nome: "Nano Brownie Tradicional", quantidade: 4 },
      ],
      HOJE
    );
    const pacotes = etiquetas.filter((e) => e.tipo === "pacote");
    const avulsos = etiquetas.filter((e) => e.tipo === "avulso");
    expect(pacotes).toHaveLength(1);
    expect(pacotes[0].tipo === "pacote" && pacotes[0].pacote.unidades).toBe(40);
    expect(pacotes[0].tipo === "pacote" && pacotes[0].sabores).toHaveLength(3);
    expect(avulsos.map((e) => e.tipo === "avulso" && e.rotulo)).toEqual(["1 de 4", "2 de 4", "3 de 4", "4 de 4"]);
  });

  it("pedido de mais de um pacote lista os sabores do pedido inteiro em cada etiqueta", () => {
    const etiquetas = montarEtiquetasPedido(
      "Padaria Vaccari",
      [
        { nome: "Brownie Avelã", quantidade: 25 },
        { nome: "Brownie Tradicional", quantidade: 25 },
      ],
      HOJE
    );
    expect(etiquetas).toHaveLength(2);
    for (const e of etiquetas) {
      expect(e.tipo).toBe("pacote");
      if (e.tipo === "pacote") {
        expect(e.pacote.unidades).toBe(25);
        expect(e.sabores.map((s) => s.quantidade)).toEqual([25, 25]);
      }
    }
  });

  it("The Brothers não recebe etiqueta", () => {
    expect(
      montarEtiquetasPedido("The Brothers Distribuidora", [{ nome: "Mini Brownie Tradicional", quantidade: 54 }], HOJE)
    ).toEqual([]);
  });

  it("pedido só de nano não tem etiqueta de brownie", () => {
    const etiquetas = montarEtiquetasPedido("REDEVIP24H (Menino Deus)", [{ nome: "Nano Brownie Tradicional", quantidade: 1 }], HOJE);
    expect(etiquetas).toHaveLength(1);
    expect(etiquetas[0].tipo).toBe("avulso");
    expect(etiquetas[0].tipo === "avulso" && etiquetas[0].legenda).toBe("Pacote de 1 kg");
  });

  it("mini também sai um por pacote", () => {
    const etiquetas = montarEtiquetasPedido("Karen Kunzler", [{ nome: "Mini Brownie Tradicional", quantidade: 3 }], HOJE);
    expect(etiquetas.map((e) => e.tipo)).toEqual(["avulso", "avulso", "avulso"]);
    expect(etiquetas.map((e) => e.tipo === "avulso" && e.legenda)).toEqual(["", "", ""]);
  });

  it("validade é a data da impressão mais 120 dias", () => {
    const [e] = montarEtiquetasPedido("X", [{ nome: "Nano Brownie Tradicional", quantidade: 1 }], HOJE);
    expect(e.tipo === "avulso" && e.validade).toEqual(new Date(2027, 1, 6)); // 06/02/2027
    expect(somarDias(new Date(2026, 11, 20), 120)).toEqual(new Date(2027, 3, 19));
  });
});

describe("etiqueta por display", () => {
  const sortido = (n: number) => [
    { nome: "Brownie Avelã", quantidade: 5 * n },
    { nome: "Brownie Stikadinho", quantidade: 4 * n },
    { nome: "Brownie Choco Duo", quantidade: 5 * n },
    { nome: "Brownie Tradicional", quantidade: 3 * n },
    { nome: "Brownie Meio Amargo", quantidade: 1 * n },
  ];

  it("dá uma etiqueta por display sortido, com o conteúdo exato de cada um", () => {
    const etiquetas = montarEtiquetasPedido("Atacado Simionato", sortido(6), HOJE, { sortido: 6, sabores: {} });
    expect(etiquetas).toHaveLength(6);
    expect(etiquetas.map((e) => e.tipo === "display" && e.rotulo)).toEqual([
      "1 de 6", "2 de 6", "3 de 6", "4 de 6", "5 de 6", "6 de 6",
    ]);
    const [primeira] = etiquetas;
    expect(primeira.tipo).toBe("display");
    if (primeira.tipo !== "display") return;
    expect(primeira.titulo).toBe("Display sortido");
    expect(primeira.unidades).toBe(18);
    expect(primeira.unidadesDoPedido).toBe(108);
    expect(primeira.sabores.map((s) => s.quantidade)).toEqual([5, 4, 5, 3, 1]);
  });

  it("pedido misto: sortidos primeiro, depois os de um sabor só", () => {
    const itens = sortido(2).map((i) => (i.nome === "Brownie Avelã" ? { ...i, quantidade: i.quantidade + 18 } : i));
    const etiquetas = montarEtiquetasPedido("Mercado", itens, HOJE, {
      sortido: 2,
      sabores: { "Brownie Avelã": 1 },
    });
    expect(etiquetas.map((e) => e.tipo === "display" && e.titulo)).toEqual([
      "Display sortido", "Display sortido", "Display Avelã",
    ]);
    const ultima = etiquetas[2];
    expect(ultima.tipo === "display" && ultima.sabores).toEqual([{ nome: "Brownie Avelã", quantidade: 18 }]);
    const primeira = etiquetas[0];
    expect(primeira.tipo === "display" && primeira.sabores.find((s) => s.nome === "Brownie Avelã")?.quantidade).toBe(5);
  });

  it("itens que não fecham com os displays voltam para a etiqueta de pacote", () => {
    const itens = sortido(2).map((i) => (i.nome === "Brownie Meio Amargo" ? { ...i, quantidade: 3 } : i));
    const etiquetas = montarEtiquetasPedido("Mercado", itens, HOJE, { sortido: 2, sabores: {} });
    expect(etiquetas.every((e) => e.tipo === "pacote")).toBe(true);
  });

  it("pedido sem displays continua por pacote", () => {
    const etiquetas = montarEtiquetasPedido("Padaria", sortido(2), HOJE, null);
    expect(etiquetas.map((e) => e.tipo)).toEqual(["pacote"]);
  });
});
