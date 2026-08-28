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
 *   1. recorte circular — fora do disco o PNG é branco OPACO (não há
 *      transparência), e branco passaria no corte como se fosse desenho;
 *   2. redução para 216 px, que é 27 mm a 203 dpi, o tamanho em que ela é
 *      usada. Reduzir ANTES de binarizar suaviza a borda e o corte sai limpo;
 *      esticar depois deixaria serrilhado.
 *   3. corte de luminância em 150: o vermelho do disco cai para preto, o
 *      laranja e o creme sobem para branco.
 */
export const MARCA_TERMICA =
  "data:image/png;base64," +
  "iVBORw0KGgoAAAANSUhEUgAAANgAAADYAQAAAAChWxBAAAADLUlEQVR42u1YPW7bMBh9pIVYQwBr" +
  "a4cCVoEeoAcoah+lR+gNrLHdcoP0ED2AgCzdmhtURYd6VAADkRNFr4MiivpIyvKQpIM5JIge38eP" +
  "388jGeA0TuM0TuO4sSqC0IxVEFuw6f/QNqlGAuXH3szwCci8BjfMSOZejLwiWfhsKuBd2H/ekix9" +
  "vAgoB5O1Q499WCxnubz7xoMlnb+5lxcD2OG9g300VGdhxUuSJH/aqTA7b8cvUtqMrHmZwMwinqJY" +
  "sh+54KXWvDQUlz4KBlu7U/RIrZqyovVxHx/kTcHUQV5+2OZ9PrLehzC202EsVmGsaDOoZVgyAEkb" +
  "XYtXya0MbWYtP3Wa75ZcsbEyb/FqmXndm4sBoBmJmRrBaqsQde93E85RfjDvdx5slqeRVU+D/XWt" +
  "UlrLatMqJWUItGj2qP0yyFH6GOAClcmYdlK0c2yuAZ0B+IE+qj3v/PH31vgj954hN/a13f4NAFyg" +
  "08NeHs7AaPG4l8KRjq9UBFMZd0XW1YYVlvWKJCR2RTJb1hsK0VJksyRZLqoNWTvYhmQ9K0lxJhml" +
  "y4owVrwNY6XqMRmz85FammkHi6SuWmNutPNveD28Pk6z/luselFf4sm8coAlI7x0BFtPXq8QysrQ" +
  "mapG9icsp1PjEo1g8fg5HeQl3ivTYZ4IZzSVt/YG+fCdgd6vB9dTwO/2z5vUamxxf7koPXkvrl0l" +
  "MLwdADwMjOjuRxOupXxyP6Ty7HBmalESic+mtmsxGWBphL0GstRNI5IYFYE1peU5WS1ZgtyTQpNb" +
  "hSxNV5TWWbUXRUq3JpRvI2cLkqyN2NOyqb6Hwzdv3etF2z5TzwAAX47Qpe7JFLZ5A6BBSl8N1hlA" +
  "1l1dMBIxa9LPN13MnBNOmc3/qd3T77LzpeljOKvlBVBP6pXmmXWeT7FedgRvooYgfwI/iyN4nGiz" +
  "fOZzunrh+4t9h5Y1vxvhlRYmi/6brUUcqZfhQfYw8LPwPYR0f8Hvx3aA3XlcMbpIz8NLe57hD17V" +
  "GsqLdl4pwPXIG10h+P+C/chNuXDfiXQ+aXkR8pjsBc/biytLjv1EfwvjFcltqOjmHOTxH+0Y35LW" +
  "dNSMAAAAAElFTkSuQmCC";
