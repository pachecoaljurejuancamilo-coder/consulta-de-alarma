import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// base './' => funciona en GitHub Pages, Netlify o cualquier carpeta.
export default defineConfig({
  base: './',
  build: {
    target: 'es2019',
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      input: {
        juego: resolve(import.meta.dirname, 'index.html'),
        resultados: resolve(import.meta.dirname, 'resultados.html'),
      },
    },
  },
  server: { host: true, port: 5173 },
  preview: { host: true },
});
