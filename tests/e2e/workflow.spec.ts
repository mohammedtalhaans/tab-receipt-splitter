import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { demoReview, demoResults, noHorizontalOverflow } from './helpers.ts';

test('complete demo, exact shares, local export, private network, refresh reset', async ({ page, baseURL }) => {

  const invalidRequests: string[] = [];

  const errors: string[] = [];

  page.on('pageerror', error => errors.push(error.message));

  page.on('request', request => {

    const url = new URL(request.url());

    if (!['GET', 'HEAD'].includes(request.method()) || (['http:', 'https:'].includes(url.protocol) && url.origin !== new URL(baseURL!).origin)) invalidRequests.push(`${request.method()} ${url.origin}`);

  });

  await demoResults(page);

  const amounts = page.locator('.person-result-summary > .number-ticker > .sr-only');

  await expect(amounts).toHaveText(['$81.25', '$48.75', '$61.25', '$35.00', '$30.00']);

  await page.locator('.person-result-summary').first().click();

  await expect(page.locator('.person-result-details').first()).toContainText('Ribeye');

  await page.getByRole('button', { name: 'Share results', exact: true }).click();

  const preview = page.locator('.share-card-preview img');

  await expect(preview).toBeVisible();

  const dimensions = await preview.evaluate((image: HTMLImageElement) => [image.naturalWidth, image.naturalHeight]);

  expect(dimensions).toEqual([1080, 1390]);

  expect(await preview.getAttribute('src')).toMatch(/^blob:/);

  expect(invalidRequests).toEqual([]);

  expect(errors).toEqual([]);

  expect(await page.evaluate(() => [localStorage.length, sessionStorage.length])).toEqual([0, 0]);

  await page.reload();

  await expect(page.locator('.home-screen')).toBeVisible();

  await page.getByRole('button', { name: 'Scan receipt', exact: true }).click();

  await page.getByRole('button', { name: 'Enter items manually' }).click();

  await expect(page.locator('.review-item')).toHaveCount(0);
});

test('landing is OCR-lazy and passes automated accessibility rules', async ({ page }) => {

  const requested: string[] = [];

  page.on('request', request => requested.push(request.url()));

  await page.goto('./');

  await expect(page.getByRole('heading', { level: 1 })).toContainText('Who ordered');

  expect(requested.some(url => /ocr-engine|worker\.min\.js|\.wasm|traineddata/.test(url))).toBe(false);

  const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();

  expect(audit.violations).toEqual([]);
});

for (const width of [320, 360, 375, 390, 430]) {

  test(`full workflow fits ${width}px`, async ({ page }) => {

    await page.setViewportSize({ width, height: 844 });

    await demoReview(page);
    await noHorizontalOverflow(page);

    await page.getByRole('button', { name: 'Looks good. Who’s in?' }).click();
    await noHorizontalOverflow(page);

    await page.getByRole('button', { name: 'That’s everyone' }).click();
    await noHorizontalOverflow(page);

    await expect(page.getByRole('button', { name: 'On to the finishing touches' })).toBeDisabled();

    await page.getByRole('button', { name: 'Share all 10 remaining items' }).click();

    await page.getByRole('dialog').getByRole('button', { name: 'Yes, these are for the table' }).click();

    await page.getByRole('button', { name: 'On to the finishing touches' }).click();
    await noHorizontalOverflow(page);

    await page.getByRole('button', { name: 'Calculate everyone’s share' }).click();
    await noHorizontalOverflow(page);

    await page.getByRole('button', { name: 'Share results', exact: true }).click();

    await expect(page.locator('.share-card-preview img')).toBeVisible();
    await noHorizontalOverflow(page);

  });
}

test('manual entry, explicit reference total, and keyboard-added person', async ({ page }) => {

  await page.goto('./');

  await page.getByRole('button', { name: 'Scan receipt', exact: true }).click();

  await page.getByRole('button', { name: 'Enter items manually' }).click();

  await page.getByRole('button', { name: 'Add your first item' }).click();

  const dialog = page.getByRole('dialog');

  await dialog.getByLabel('Item name').fill('Coffee');

  await dialog.getByLabel(/Line total/).fill('4.51');

  await dialog.getByRole('button', { name: 'Add item', exact: true }).click();

  await expect(page.getByRole('button', { name: 'Looks good. Who’s in?' })).toBeDisabled();

  await page.getByRole('button', { name: 'Use the checked item sum' }).click();

  await page.getByRole('button', { name: 'Yes, that’s the receipt total' }).click();

  await page.getByRole('button', { name: 'Looks good. Who’s in?' }).click();

  await page.getByLabel('Person’s name').fill('Ada');

  await page.getByLabel('Person’s name').press('Enter');

  await page.getByRole('button', { name: 'That’s everyone' }).click();

  await page.getByRole('button', { name: 'Ada', exact: true }).click();

  await page.getByRole('button', { name: 'On to the finishing touches' }).click();

  await page.getByRole('button', { name: 'Calculate everyone’s share' }).click();

  await expect(page.locator('.result-heading h1')).toContainText('$4.51');
});

test('unsupported file has a manual escape; no alerts', async ({ page }) => {

  await page.goto('./');

  await page.getByRole('button', { name: 'Scan receipt', exact: true }).click();

  await page.getByLabel('Choose a receipt image').setInputFiles({ name: 'not-a-receipt.pdf', mimeType: 'application/pdf', buffer: Buffer.from('not an image') });

  await expect(page.getByRole('button', { name: 'Enter manually', exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Enter manually', exact: true }).click();

  await expect(page.locator('.review-screen')).toBeVisible();
});

test('clipboard denial has selectable text instead of an error dead-end', async ({ page }) => {

  await page.addInitScript(() => {

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true, value: {
        writeText: async () => {
          throw new DOMException('Denied', 'NotAllowedError');
        }
      }
    });

  });

  await demoResults(page);

  await page.getByRole('button', { name: 'Copy summary', exact: true }).click();

  await expect(page.getByRole('textbox', { name: 'Split summary to copy' })).toHaveValue(/256\.25/);
});

test('stage changes focus the visible heading for keyboard users', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Scan receipt', exact: true }).click();
  await expect(page.locator('.capture-screen h1')).toBeFocused();
  await page.getByRole('button', { name: 'Enter items manually' }).click();
  await expect(page.locator('.review-screen h1')).toBeFocused();
});

test('six-person results export leaves space for every person and the footer', async ({ page }) => {
  await demoReview(page);
  await page.getByRole('button', { name: 'Looks good. Who’s in?' }).click();
  await page.getByLabel('Person’s name').fill('Ada');
  await page.getByLabel('Person’s name').press('Enter');
  await page.getByRole('button', { name: 'That’s everyone' }).click();
  await page.getByRole('button', { name: 'Share all 10 remaining items' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Yes, these are for the table' }).click();
  await page.getByRole('button', { name: 'On to the finishing touches' }).click();
  await page.getByRole('button', { name: 'Calculate everyone’s share' }).click();
  await expect(page.locator('.person-result-summary')).toHaveCount(6);
  await page.getByRole('button', { name: 'Share results', exact: true }).click();
  const preview = page.locator('.share-card-preview img');
  await expect(preview).toBeVisible();
  expect(await preview.evaluate((image: HTMLImageElement) => [image.naturalWidth, image.naturalHeight])).toEqual([1080, 1502]);
});
