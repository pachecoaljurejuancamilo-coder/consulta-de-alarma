// Partida completa en modo autopiloto (?demo=1): verifica los 3:00, la ausencia de errores
// y la pantalla de resultados. Guarda una captura de cada fase en capturas/<proyecto>/.
import { test, expect } from '@playwright/test';
import fs from 'node:fs';

const FASES = [
  { t: 4, nombre: '02-mision-marcador' },
  { t: 13, nombre: '03-mision-anamnesis' },
  { t: 27, nombre: '04-mision-decision' },
  { t: 48, nombre: '05-mision2-anamnesis' },
  { t: 107, nombre: '06-jefe-intro' },
  { t: 119, nombre: '07-jefe-pregunta' },
  { t: 158.5, nombre: '08-salida-arcos' },
  { t: 177.5, nombre: '09-salida-portal' },
];

const estado = (page) => page.evaluate(() => window.__codigoAlarma?.());

test('modo demo: 3:00 completos, sin errores y con resultados', async ({ page }, info) => {
  const errores = [];
  page.on('console', (m) => m.type() === 'error' && errores.push(m.text()));
  page.on('pageerror', (e) => errores.push(e.message));
  const dir = `capturas/${info.project.name}`;
  fs.mkdirSync(dir, { recursive: true });

  await page.goto('/?demo=1&loop=0&debug=1');
  await page.waitForSelector('.pantalla-seleccion');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${dir}/01-seleccion.png` });

  await page.waitForFunction(() => window.__codigoAlarma?.().activo, null, { timeout: 120_000 });
  for (const f of FASES) {
    await page.waitForFunction((t) => window.__codigoAlarma().t >= t || window.__codigoAlarma().pantalla === 'resultados', f.t, { timeout: 200_000 });
    await page.screenshot({ path: `${dir}/${f.nombre}.png` });
  }

  await page.waitForSelector('[data-testid=resultados]', { timeout: 60_000 });
  const fin = await estado(page);
  expect(fin.t).toBeGreaterThanOrEqual(180);
  await expect(page.getByTestId('turno-completo')).toContainText('3:00');
  expect(fin.resultado.tiempo_total_s).toBe(180);
  expect(fin.resultado.puntaje).toBeGreaterThan(0);
  expect(['Sí', 'Tal vez', 'No', 'sin respuesta']).toContain(fin.resultado.op_reconocerias);
  await page.waitForTimeout(2200);
  await page.screenshot({ path: `${dir}/10-resultados.png` });
  await page.getByRole('tab', { name: 'Repaso' }).click();
  await page.screenshot({ path: `${dir}/11-repaso.png` });
  await page.getByRole('tab', { name: 'Ranking' }).click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${dir}/12-ranking.png` });

  expect(errores, errores.join('\n')).toEqual([]);
});

test('controles: se puede escribir el nombre, empezar y mover al personaje', async ({ page }, info) => {
  test.skip(info.project.name !== 'escritorio', 'Prueba de teclado solo en escritorio');
  const errores = [];
  page.on('pageerror', (e) => errores.push(e.message));
  await page.goto('/');
  await page.getByTestId('nombre').fill('Prueba');
  await page.getByRole('radio', { name: 'VI', exact: true }).click();
  await page.getByRole('radio', { name: /Gino/ }).click();
  await page.waitForFunction(() => !document.querySelector('[data-testid=empezar]').textContent.includes('cargando'), null, { timeout: 120_000 });
  await page.getByTestId('empezar').click();
  await page.waitForFunction(() => window.__codigoAlarma().activo, null, { timeout: 20_000 });
  const antes = (await estado(page)).pos;
  await page.keyboard.down('KeyW');
  await page.waitForTimeout(1500);
  await page.keyboard.up('KeyW');
  await page.keyboard.press('Space');
  await page.keyboard.press('ShiftLeft');
  await page.mouse.click(700, 400);
  const despues = (await estado(page)).pos;
  const avance = Math.hypot(despues[0] - antes[0], despues[2] - antes[2]);
  expect(avance).toBeGreaterThan(3);
  await expect(page.getByTestId('cronometro')).toBeVisible();
  expect(errores).toEqual([]);
});
