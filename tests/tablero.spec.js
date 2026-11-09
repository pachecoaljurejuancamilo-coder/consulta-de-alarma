import { test, expect } from '@playwright/test';

test('el tablero en vivo muestra datos de demostración', async ({ page }, info) => {
  test.skip(info.project.name !== 'escritorio', 'Solo en escritorio');
  await page.goto('/resultados.html?demo');
  await expect(page.getByTestId('participantes')).toHaveText('14');
  await expect(page.locator('#tb-signos .tb-fila')).toHaveCount(7);
  await expect(page.locator('#tb-misiones .tb-fila')).toHaveCount(3);
  await page.screenshot({ path: 'capturas/escritorio/13-tablero.png', fullPage: true });
});
