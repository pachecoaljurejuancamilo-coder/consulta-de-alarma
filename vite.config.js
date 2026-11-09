import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

// base './' => funciona en GitHub Pages, Netlify o cualquier carpeta.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 4000,
    assetsInlineLimit: 0,
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
