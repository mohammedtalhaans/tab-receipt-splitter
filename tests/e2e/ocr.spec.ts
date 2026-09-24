import { fileURLToPath } from 'node:url';
import { test, expect } from '@playwright/test';

test('actual local Tesseract worker reads the clean receipt without uploads', async ({ page, baseURL }) => {

  test.skip(process.env.RUN_OCR_TESTS !== '1', 'Opt-in real WASM OCR integration; enabled in deployment CI.');

  test.setTimeout(180_000);

  const network: {
    url: string;
    method: string
   }[] = [];

  page.on('request', request => network.push({ url: request.url(), method: request.method() }));

  await page.goto('./');

  await page.getByRole('button', { name: 'Scan receipt', exact: true }).click();

  await page.getByLabel('Choose a receipt image').setInputFiles(fileURLToPath(new URL('../fixtures/clean.png', import.meta.url)));

  await expect(page.getByRole('button', { name: 'Check 10 items' })).toBeVisible({ timeout: 150_000 });

  await page.getByRole('button', { name: 'Check 10 items' }).click();

  await expect(page.locator('.review-item')).toHaveCount(10);

  await expect(page.locator('.reconciliation')).toContainText('Receipt matched');

  expect(network.some(request => request.url.includes('worker.min.js'))).toBe(true);

  expect(network.some(request => request.url.includes('.wasm'))).toBe(true);

  expect(network.some(request => request.url.includes('traineddata'))).toBe(true);

  const origin = new URL(baseURL!).origin;

  expect(network.filter(request => !['GET', 'HEAD'].includes(request.method) || (/^https?:/.test(request.url) && new URL(request.url).origin !== origin))).toEqual([]);
});
