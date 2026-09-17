import { defineConfig } from 'vitest/config';
import path from 'path';

/**
 * Testes das funções puras — do app e da extensão.
 *
 * O alias do Supabase aponta para o client da extensão só no build dela; aqui
 * nada toca no banco, então basta o `@` e o `@ext`.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@ext': path.resolve(__dirname, './extension/src'),
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    include: ['src/**/*.test.ts', 'extension/**/*.test.ts'],
  },
});
