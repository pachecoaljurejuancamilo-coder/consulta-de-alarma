// Pruebas de una partida completa en viewport de celular.
import { test, expect } from '@playwright/test';
import { CASOS, PREGUNTAS } from '../src/data/contenido.js';

async function sinDesborde(page, donde) {
  const ok = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
  expect(ok, `Desborde horizontal en: ${donde}`).toBeTruthy();
}

async function ingresar(page, nombre, semestre) {
  await page.goto('/?modo=2d');
  await expect(page.getByTestId('portada')).toBeVisible({ timeout: 20_000 });
  await sinDesborde(page, 'portada');
  await expect(page.locator('#btn-iniciar')).toBeDisabled();
  await page.fill('#nombre', nombre);
  await page.locator('label.chip-radio', { hasText: new RegExp(`^${semestre}$`) }).click();
  await expect(page.locator('#btn-iniciar')).toBeEnabled();
  await page.click('#btn-iniciar');
  await expect(page.locator('#barra')).toBeVisible();
}

// Cierra el globo del tutor si sigue visible (si ya se fue solo, no pasa nada)
async function cerrarGlobo(page) {
  await page.locator('.globo-btn').click({ timeout: 4000 }).catch(() => {});
}

async function segundosCronometro(page) {
  return Number(await page.locator('#cronometro').getAttribute('data-segundos'));
}

test('partida completa jugando bien: llega a resultados con rango Especialista', async ({ page }) => {
  await ingresar(page, 'Bot rápido', 'VIII');

  for (const caso of CASOS) {
    const consulta = page.locator(`[data-caso="${caso.id}"]`);
    await expect(consulta).toBeVisible();
    await expect(page.getByTestId('intro-etapa')).toHaveCount(0, { timeout: 5000 });
    await sinDesborde(page, `caso ${caso.id}`);
    for (const h of caso.hallazgos.filter((x) => x.tipo === 'alarma')) {
      const t = consulta.locator(`.tarjeta[data-id="${h.id}"]`);
      await t.click();
      await expect(t).toHaveAttribute('aria-pressed', 'true');
    }
    await consulta.locator(`[data-decision="${caso.correcta}"]`).click();
    await expect(page.getByTestId('globo')).toBeVisible();
    await expect(page.getByTestId('globo')).toContainText('correcta');
    await cerrarGlobo(page);
  }

  for (const p of PREGUNTAS) {
    const quiz = page.locator(`[data-pregunta="${p.id}"]`);
    await expect(quiz).toBeVisible();
    await expect(page.getByTestId('intro-etapa')).toHaveCount(0, { timeout: 5000 });
    await sinDesborde(page, `pregunta ${p.id}`);
    await quiz.locator(`.opcion[data-texto="${p.opciones[0]}"]`).click();
    await expect(quiz.locator('.opcion.correcta')).toBeVisible();
    await cerrarGlobo(page);
  }

  await expect(page.getByTestId('op-entendiste')).toBeVisible();
  await expect(page.getByTestId('intro-etapa')).toHaveCount(0, { timeout: 5000 });
  await sinDesborde(page, 'opinión');
  await page.locator('.op-opcion[data-valor="5"]').click();
  await expect(page.getByTestId('op-innovador')).toBeVisible();
  await page.locator('.op-opcion[data-valor="4"]').click();
  await expect(page.getByTestId('op-reconocerias')).toBeVisible();
  await page.locator('.op-opcion[data-valor="Sí"]').click();
  await expect(page.getByTestId('op-palabra')).toBeVisible();
  await page.locator('.chip-sug', { hasText: 'Disquecia' }).click();

  await expect(page.getByTestId('resultados')).toBeVisible();
  await sinDesborde(page, 'resultados');
  const puntaje = Number(await page.getByTestId('puntaje-final').getAttribute('data-valor'));
  expect(puntaje).toBeGreaterThanOrEqual(250);
  await expect(page.getByTestId('rango')).toContainText('Especialista en alarma');
  expect(await segundosCronometro(page)).toBeLessThanOrEqual(180);

  // Se guardó la partida (sin backend, en localStorage)
  const guardado = await page.evaluate(() => JSON.parse(localStorage.getItem('cda_historial') || '[]').pop());
  expect(guardado.nombre).toBe('Bot rápido');
  expect(guardado.op_palabra).toBe('Disquecia');
  expect(guardado.op_entendiste).toBe(5);
  expect(guardado.tarjetas_correctas).toBe(15);
  expect(guardado.preguntas_correctas).toBe(4);

  // Ranking y confeti (primer puesto en este dispositivo)
  await expect(page.locator('#res-top')).toContainText('puesto 1', { timeout: 8000 });
  await page.getByTestId('btn-ranking').click();
  await expect(page.getByTestId('modal-ranking')).toContainText('Bot rápido');
});

test('partida completa usando todo el tiempo: el cronómetro llega a 3:00 y aparecen los resultados', async ({ page }) => {
  await ingresar(page, 'Bot paciente', 'II');

  for (const caso of CASOS) {
    const consulta = page.locator(`[data-caso="${caso.id}"]`);
    await expect(consulta).toBeVisible({ timeout: 40_000 });
    await expect(page.getByTestId('intro-etapa')).toHaveCount(0, { timeout: 5000 });
    for (const h of caso.hallazgos.filter((x) => x.tipo === 'alarma')) await consulta.locator(`.tarjeta[data-id="${h.id}"]`).click();
    // Espera hasta los últimos segundos de la paciente y decide
    await page.waitForFunction(
      (id) => Number(document.querySelector(`[data-caso="${id}"] .anillo`)?.dataset.restante || 99) <= 2,
      caso.id,
      { timeout: 40_000 },
    );
    await consulta.locator(`[data-decision="${caso.correcta}"]`).click();
    await expect(page.getByTestId('globo')).toBeVisible();
  }

  for (const p of PREGUNTAS) {
    const quiz = page.locator(`[data-pregunta="${p.id}"]`);
    await expect(quiz).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId('intro-etapa')).toHaveCount(0, { timeout: 5000 });
    await expect(quiz.locator('.quiz-tiempo.urgente')).toBeVisible({ timeout: 15_000 });
    await quiz.locator(`.opcion[data-texto="${p.opciones[0]}"]`).click();
  }

  await expect(page.getByTestId('op-entendiste')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId('intro-etapa')).toHaveCount(0, { timeout: 5000 });
  await page.locator('.op-opcion[data-valor="4"]').click();
  await page.getByTestId('op-innovador').locator('.op-opcion[data-valor="5"]').click();
  await page.getByTestId('op-reconocerias').locator('.op-opcion[data-valor="Tal vez"]').click();
  await page.fill('#op-palabra', 'No es normal');
  // No pulsa «Terminar»: deja que el tiempo se agote

  await expect(page.getByTestId('resultados')).toBeVisible({ timeout: 40_000 });
  await expect(page.locator('#cronometro')).toHaveText('3:00');
  await expect(page.getByTestId('tiempo-final')).toHaveText('3:00');
  const guardado = await page.evaluate(() => JSON.parse(localStorage.getItem('cda_historial') || '[]').pop());
  expect(guardado.tiempo_total_s).toBe(180);
  expect(guardado.decisiones_correctas).toBe(3);
  expect(guardado.op_palabra).toBe('No es normal');
});

test('nadie toca nada: cada etapa avanza sola y el turno termina en 3:00', async ({ page }) => {
  await ingresar(page, 'Bot dormido', 'Docente');
  await expect(page.getByTestId('quiz')).toBeVisible({ timeout: 110_000 });
  expect(await segundosCronometro(page)).toBeGreaterThanOrEqual(104);
  await expect(page.getByTestId('opinion')).toBeVisible({ timeout: 50_000 });
  expect(await segundosCronometro(page)).toBeGreaterThanOrEqual(149);
  await expect(page.getByTestId('resultados')).toBeVisible({ timeout: 35_000 });
  await expect(page.locator('#cronometro')).toHaveText('3:00');
  const guardado = await page.evaluate(() => JSON.parse(localStorage.getItem('cda_historial') || '[]').pop());
  expect(guardado.caso_valentina).toBe('Sin decisión');
  expect(guardado.p1).toBe('Sin respuesta');
});
