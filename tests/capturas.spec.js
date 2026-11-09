// Capturas de pantalla en varios tamaños para revisar que nada se desborde.
// Se guardan en la carpeta capturas/.
import { test, expect } from '@playwright/test';
import { CASOS, PREGUNTAS } from '../src/data/contenido.js';

const TAMANOS = [
  { nombre: '360', width: 360, height: 740, movil: true },
  { nombre: '390', width: 390, height: 844, movil: true },
  { nombre: '430', width: 430, height: 932, movil: true },
  { nombre: 'proyector', width: 1366, height: 768, movil: false },
];

for (const t of TAMANOS) {
  test.describe(`capturas ${t.nombre}`, () => {
    test.use({ viewport: { width: t.width, height: t.height }, isMobile: t.movil, hasTouch: t.movil, deviceScaleFactor: 1 });

    test(`recorrido ${t.nombre}`, async ({ page }) => {
      const desbordes = [];
      const foto = async (nombre) => {
        await page.waitForTimeout(450);
        const ancho = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth]);
        if (ancho[0] > ancho[1] + 1) desbordes.push(`${nombre}: ${ancho[0]} > ${ancho[1]}`);
        // Elementos que se salen por la derecha
        const fuera = await page.evaluate(() =>
          [...document.querySelectorAll('body *')]
            .filter((e) => {
              const r = e.getBoundingClientRect();
              const s = getComputedStyle(e);
              return r.width > 0 && r.right > window.innerWidth + 2 && s.position !== 'fixed' && !e.closest('#fondo2d, .intro-etapa, .res-tutores');
            })
            .slice(0, 5)
            .map((e) => `${e.tagName}.${e.className}`),
        );
        if (fuera.length) desbordes.push(`${nombre}: ${fuera.join(', ')}`);
        await page.screenshot({ path: `capturas/${t.nombre}-${nombre}.png` });
      };

      await page.goto('/?modo=3d');
      await expect(page.getByTestId('portada')).toBeVisible({ timeout: 20_000 });
      await page.waitForTimeout(2500);
      await foto('01-portada');
      await page.fill('#nombre', 'Capturas');
      await page.locator('label.chip-radio', { hasText: /^Docente$/ }).click();
      await page.click('#btn-iniciar');
      await page.waitForTimeout(600);
      await foto('02-intro');

      const c0 = CASOS[1];
      // Sofía: decide rápido; Valentina: fotos con tarjetas y globo
      const sofia = page.locator('[data-testid="consulta"]');
      await expect(page.getByTestId('intro-etapa')).toHaveCount(0, { timeout: 5000 });
      await page.waitForTimeout(2500);
      await foto('03-consulta');
      await sofia.locator('[data-decision="dismenorrea"]').click();
      await page.locator('.globo-btn').click({ timeout: 4000 }).catch(() => {});
      const val = page.locator(`[data-caso="${c0.id}"]`);
      await expect(val).toBeVisible({ timeout: 40_000 });
      await val.locator(`.tarjeta[data-id="v_disquecia"]`).click();
      await val.locator(`.tarjeta[data-id="v_aine"]`).click();
      await val.locator('.hallazgos').scrollIntoViewIfNeeded();
      await foto('04-tarjetas-marcadas');
      await val.locator('[data-decision="remitir"]').click();
      await page.waitForTimeout(300);
      await foto('05-globo-tutor');
      await page.locator('.globo-btn').click({ timeout: 4000 }).catch(() => {});
      const mar = page.locator('[data-caso="mariana"]');
      await expect(mar).toBeVisible({ timeout: 40_000 });
      await mar.locator('[data-decision="dismenorrea"]').click();
      await page.locator('.globo-btn').click({ timeout: 4000 }).catch(() => {});

      const q = page.locator(`[data-pregunta="p1"]`);
      await expect(q).toBeVisible({ timeout: 40_000 });
      await page.waitForTimeout(500);
      await foto('06-intro-etapa2');
      await expect(page.getByTestId('intro-etapa')).toHaveCount(0, { timeout: 5000 });
      await foto('07-pregunta');
      await q.locator(`.opcion[data-texto="${PREGUNTAS[0].opciones[1]}"]`).click();
      await page.waitForTimeout(300);
      await foto('08-pregunta-feedback');
      for (const p of PREGUNTAS.slice(1)) {
        await page.locator('.globo-btn').click({ timeout: 4000 }).catch(() => {});
        const qq = page.locator(`[data-pregunta="${p.id}"]`);
        await expect(qq).toBeVisible({ timeout: 15_000 });
        await qq.locator(`.opcion[data-texto="${p.opciones[0]}"]`).click();
      }
      await page.locator('.globo-btn').click({ timeout: 4000 }).catch(() => {});
      await expect(page.getByTestId('op-entendiste')).toBeVisible({ timeout: 20_000 });
      await expect(page.getByTestId('intro-etapa')).toHaveCount(0, { timeout: 5000 });
      await foto('09-opinion');
      await page.locator('.op-opcion[data-valor="4"]').click();
      await page.getByTestId('op-innovador').locator('.op-opcion[data-valor="5"]').click();
      await page.getByTestId('op-reconocerias').locator('.op-opcion[data-valor="Sí"]').click();
      await expect(page.getByTestId('op-palabra')).toBeVisible();
      await foto('10-palabra');
      await page.getByTestId('btn-terminar').click();
      await expect(page.getByTestId('resultados')).toBeVisible();
      await page.waitForTimeout(2500);
      await foto('11-resultados');
      await page.evaluate(() => window.scrollTo(0, 900));
      await foto('12-repaso');
      await page.getByTestId('btn-ranking').click();
      await page.waitForTimeout(800);
      await foto('13-ranking');

      await page.goto('/resultados.html?demo');
      await expect(page.getByTestId('participantes')).not.toHaveText('0');
      await page.waitForTimeout(1200);
      await foto('14-tablero');

      expect(desbordes, desbordes.join('\n')).toEqual([]);
    });
  });
}
