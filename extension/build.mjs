/**
 * Gera a extensão em dist-extension/.
 *
 * São dois builds porque o painel e o service worker saem como ES module e o
 * content script precisa ser um arquivo único (IIFE). No fim, copia o manifest.
 */
import { build } from 'vite';
import { copyFile, mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const saida = path.resolve(aqui, '../dist-extension');

console.log('painel e service worker...');
await build({ configFile: path.resolve(aqui, 'vite.config.panel.mts') });

console.log('content script...');
await build({ configFile: path.resolve(aqui, 'vite.config.content.mts') });

await mkdir(saida, { recursive: true });
await copyFile(path.resolve(aqui, 'manifest.json'), path.join(saida, 'manifest.json'));

console.log(`\npronto: ${saida}`);
console.log('no Brave: brave://extensions > Modo do desenvolvedor > Carregar sem compactação');
