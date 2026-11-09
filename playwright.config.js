import { defineConfig } from '@playwright/test';

// Pruebas del juego compilado (npm run build + vite preview).
// Cada partida demo dura 3:00 reales, así que los tiempos de espera son largos.
const gpu = ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'];

export default defineConfig({
  testDir: './tests',
  timeout: 330_000,
  fullyParallel: true,
  workers: 2,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4173',
    locale: 'es-CO',
    trace: 'retain-on-failure',
    launchOptions: { args: gpu },
  },
  projects: [
    { name: 'celular-horizontal', use: { viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 } },
    { name: 'escritorio', use: { viewport: { width: 1366, height: 768 } } },
  ],
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
