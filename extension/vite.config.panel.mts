import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { fileURLToPath } from 'url';

const aqui = path.dirname(fileURLToPath(import.meta.url));

/**
 * Build do painel lateral e do service worker (os dois em ES module).
 * O content script tem config própria — MV3 não aceita módulo lá.
 */
export default defineConfig({
  root: aqui,
  plugins: [react()],
  resolve: {
    alias: [
      // Precisa vir antes do '@': dentro da extensão, quem importar o client do
      // Supabase recebe o nosso, com a sessão guardada no chrome.storage.
      {
        find: '@/integrations/supabase/client',
        replacement: path.resolve(aqui, 'src/lib/supabase.ts'),
      },
      { find: '@ext', replacement: path.resolve(aqui, 'src') },
      { find: '@', replacement: path.resolve(aqui, '../src') },
    ],
  },
  build: {
    outDir: path.resolve(aqui, '../dist-extension'),
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: {
        panel: path.resolve(aqui, 'src/panel/index.html'),
        'service-worker': path.resolve(aqui, 'src/background/service-worker.ts'),
      },
      output: {
        // O manifest aponta para service-worker.js na raiz da saída.
        entryFileNames: (chunk) =>
          chunk.name === 'service-worker' ? 'service-worker.js' : 'assets/[name]-[hash].js',
      },
    },
  },
});
