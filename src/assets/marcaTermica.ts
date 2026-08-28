/**
 * A marca da Mischa's em dois tons, para a etiqueta térmica.
 *
 * A logo original é ilustração colorida (vermelho, laranja, creme). A impressora
 * é preto no branco puro: tom médio vira chuvisco e some. Esta é a mesma logo
 * reduzida a branco sobre preto — o gato em branco, o disco em preto.
 *
 * Vem embutida como dado, e não como arquivo: a folha de etiquetas é escrita
 * dentro de um quadro em branco, que não tem endereço base para resolver
 * caminho de imagem.
 *
 * Gerada de `src/assets/mischas-logo.png` assim:
 *
 * 1. recorte circular ANTES de tudo — fora do disco o PNG é branco OPACO (não
 *    há transparência), e esse branco passaria no corte como se fosse desenho;
 * 2. redução para 216 px, que é 27 mm a 203 dpi, o tamanho em que ela é usada.
 *    Reduzir antes de binarizar suaviza a borda; esticar depois serrilharia;
 * 3. corte de luminância em 150 — o vermelho do disco cai para preto, o laranja
 *    da cabeça e o creme da touca sobem para branco;
 * 4. contorno por detecção de borda, desenhado em preto por cima. Sem este
 *    passo, cabeça e touca viram uma mancha branca só: os dois tons passam no
 *    corte e a fronteira entre eles some. Foi exatamente o que aconteceu na
 *    primeira versão impressa.
 */
export const MARCA_TERMICA =
  "data:image/png;base64," +
  "iVBORw0KGgoAAAANSUhEUgAAANgAAADYAQAAAAChWxBAAAAEOklEQVR42u1Yu27cRhQ9QzLaBWKY" +
  "W8RAEAQR06VUmQBBRP9BPmELFylTpM4SSL4hrfcT/AOBxnKRUgqQwl3oOInViX4AGsmzc1LwNS+u" +
  "F0LkStMsybP3MffeueeSwO26Xbfrdv1/a7YFYz0JpVQTiEJOM94mtq09HEDEsY8FSqCKqlyxIinj" +
  "PvKxg1k6RXtXxLDE15NsiYOFZe+Wq1UEm3cuzaqoXAbgGMstvizCqOQkSc7CVAg+bLGcOswce8z4" +
  "9vrdcTGkKfF2ABRDmhLfOVECpWdvn+OSnlwBAGvr2t97tSXWTRwrw6DtmNtTX3ViV/Uu9VJPYCUA" +
  "0fiYHmSO74RyBGg9DXQWAH4WPlYAgLHyNWASxg9sbA/0Y8Y2B7qM5MiM5074uf0rDNxor863xtO4" +
  "qU+sE92mh6Hjed5Q56ypVySj9VlDBzpFrVABEFBwIw7sdU5Iy5vwTDf4twttMgAaEkCCZ/jEk1uU" +
  "beYrYNOXQI9RftNdHad95Hrs86EqqgaNX0tFBgVkzB5hUTtHWYP4fTEDgCUgvb5aawCfzvTdPmSW" +
  "zsUPAP6ea4GvL/x+/D2ggFx9qP0Gc06FfdZIm31uwnMkanwG04yHd4gLsruAkFwWTeJhNZIDAF9C" +
  "Yu1lXvzJc5I0wI80gb2FBCAqCJt2AEAc8YIkWeMt2Xjds1sKFwPmn5U9MZ/sBSKs60TCNJvqDXAc" +
  "cukRN+cn5EO+oO9LSvI1SbPiUQTbkGS7k8DPNjGzohpOy4j90vq5jvnSr1Vo70WPHZJ+r3vaXzxy" +
  "Gg2A1FgUsPHkfo30gP73I2yZPzjJKzZHa0/33Nahp3u58CjRod/1P45cYWMPdp8nyi1YNY2JkFt2" +
  "speE/DE8zd7FjRPYPDqkROUcPlps0VkgGI125/C+X3tYicft7bNv7UPZ/lzK1uT6VajzBGctCaal" +
  "H3ruVylJasz2OfTPruxWQNtBZr95mLjkgL0m2fFra++qS70C9nxf3oyjSDq197p7UFrYnS4if8Cm" +
  "zT5/FZYvBdaYaw9LDCDQoEpatxydKcoEgBRYZAAunTqrkK0BLKviKdDGr0vjRhTFByVQfnGfpwfD" +
  "vNQNiifqK9ZYPac5JFkt7TeHl3zCBlQrRZInjXuMczagmf1Eug00ASWpBClzH0slSeqh2TtYQ5Jm" +
  "bDIWF2/uAXglMsZq8G0FkNpE59Y1AGP6OHPu5W+e8Tt3dmrrRR+SGm3N+L0ulQBwECv8dmNQ/Sae" +
  "qJDh8n5/euwswuve2GSDPeKafaK6ptx1MXkDOusb0NncgE71nmOt37M9f9kztAk+RkzLnW7BZNfl" +
  "IkTN+7acW2iu+dyZUdz5TMVeZTvsysG6GS2NvN92rkRftZUXszPrf2cedhWasyimnDJnG1RbJjQZ" +
  "zsUMHiX+YNKTSlRp9HwfWq0s/CIyUm346hiM3Y5Jueu3tP8A5uB/DzEXpmgAAAAASUVORK5CYII=";
