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
  });

  it("mini também sai um por pacote", () => {
    const etiquetas = montarEtiquetasPedido("Karen Kunzler", [{ nome: "Mini Brownie Tradicional", quantidade: 3 }], HOJE);
    expect(etiquetas.map((e) => e.tipo)).toEqual(["avulso", "avulso", "avulso"]);
  });

  it("validade é a data da impressão mais 120 dias", () => {
    const [e] = montarEtiquetasPedido("X", [{ nome: "Nano Brownie Tradicional", quantidade: 1 }], HOJE);
    expect(e.tipo === "avulso" && e.validade).toEqual(new Date(2027, 1, 6)); // 06/02/2027
    expect(somarDias(new Date(2026, 11, 20), 120)).toEqual(new Date(2027, 3, 19));
  });
});
