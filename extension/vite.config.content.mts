import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const aqui = path.dirname(fileURLToPath(import.meta.url));

/**
 * Build do content script. Sai como IIFE (um arquivo só, sem import), porque
 * content script de MV3 não aceita ES module. Sem React e sem Supabase aqui.
 */
export default defineConfig({
  root: aqui,
  build: {
    outDir: path.resolve(aqui, '../dist-extension'),
    emptyOutDir: false,
    sourcemap: true,
    lib: {
      entry: path.resolve(aqui, 'src/content/index.ts'),
      formats: ['iife'],
      name: 'MischaWhatsApp',
      fileName: () => 'content.js',
    },
  },
});
