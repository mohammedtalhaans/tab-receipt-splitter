import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { demoResults, demoReview, noHorizontalOverflow } from './helpers.ts';

async function tableExtras(page: import('@playwright/test').Page) {
  await demoReview(page);
  await page.getByRole('button', { name: 'Looks good. Who’s in?' }).click();
  await page.getByRole('button', { name: 'That’s everyone' }).click();
  await page.getByRole('button', { name: 'Share all 10 remaining items' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Yes, these are for the table' }).click();
  await page.getByRole('button', { name: 'On to the finishing touches' }).click();
}

test('results explain receipt charges and exact individual breakdowns', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await demoResults(page);
  const receipt = page.locator('.result-receipt');
  await receipt.locator('.result-bill-breakdown > summary').click();
  await expect(receipt.locator('.result-bill-lines')).toContainText('Service charge 10%');
  await expect(receipt.locator('.result-bill-lines')).toContainText('$20.50');
  await expect(receipt.locator('.result-bill-lines')).toContainText('$30.75');
  await expect(receipt.locator('.result-included-note')).toContainText('already included');
  await page.locator('.person-result-summary').first().click();
  const details = page.getByRole('region', { name: 'Your breakdown' });
  await expect(details).toContainText('Item subtotal');
  await expect(details).toContainText('Service charge 10%');
  await expect(details).toContainText('Added tip');
  await expect(details.locator('.person-detail-total')).toContainText('$81.25');
  await page.getByRole('button', { name: 'Show all breakdowns' }).click();
  await expect(page.locator('.person-result-details')).toHaveCount(5);
  await noHorizontalOverflow(page);
  await page.screenshot({ path: 'docs/qa/results-polish-320.png', fullPage: true });
  const audit = await new AxeBuilder({ page }).include('.results-screen').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(audit.violations).toEqual([]);
  await page.getByRole('button', { name: 'Close all breakdowns' }).click();
  await expect(page.locator('.person-result-details')).toHaveCount(0);
});

test('a failed image can share text and retry without losing the split', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.toBlob;
    let fail = true;
    HTMLCanvasElement.prototype.toBlob = function(callback, type, quality) {
      if (fail) { fail = false; queueMicrotask(() => callback(null)); }
      else original.call(this, callback, type, quality);
    };
    Object.defineProperty(navigator, 'share', { configurable: true, value: async (data: ShareData) => { document.documentElement.dataset.sharedText = data.text; } });
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => false });
  });
  await demoResults(page);
  await page.getByRole('button', { name: 'Share results', exact: true }).click();
  await expect(page.getByText('The text summary is ready.')).toBeVisible();
  await expect(page.locator('.receipt-skeleton')).toHaveCount(0);
  await page.getByRole('button', { name: 'Share link', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-shared-text', /256\.25/);
  await page.getByRole('button', { name: 'Try creating the image again' }).click();
  await expect(page.locator('.share-card-preview img')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Share link', exact: true })).toBeEnabled();
});

test('native share cancellation is quiet and a failure keeps save and copy available', async ({ page }) => {
  await page.addInitScript(() => {
    let calls = 0;
    Object.defineProperty(navigator, 'share', { configurable: true, value: async () => {
      calls++;
      if (calls === 1) throw new DOMException('Cancelled', 'AbortError');
      throw new Error('Share unavailable');
    } });
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => { throw new Error('Files unsupported'); } });
  });
  await demoResults(page);
  await page.getByRole('button', { name: 'Share results', exact: true }).click();
  const share = page.getByRole('button', { name: 'Share link', exact: true });
  await share.click();
  await expect(share).toBeEnabled();
  await expect(page.locator('.share-modal .notice')).toHaveCount(0);
  await share.click();
  await expect(page.getByText('Sharing did not open.', { exact: false })).toBeVisible();
  await expect(page.getByRole('dialog').getByRole('button', { name: 'Save image', exact: true })).toBeEnabled();
  await expect(page.getByRole('dialog').getByRole('button', { name: 'Copy summary', exact: true })).toBeEnabled();
});

test('clipboard and download failures leave readable text and an image escape', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, get: () => { throw new DOMException('Denied', 'NotAllowedError'); } });
    const original = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function() {
      if (this.hasAttribute('download')) throw new Error('Download blocked');
      original.call(this);
    };
  });
  await demoResults(page);
  await page.getByRole('button', { name: 'Copy summary', exact: true }).click();
  const text = page.getByRole('textbox', { name: 'Split summary to copy' });
  await expect(text).toBeFocused();
  await expect(text).toHaveValue(/81\.25[\s\S]*48\.75/);
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.getByRole('button', { name: 'Save image', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Save image', exact: true }).click();
  await expect(dialog.getByText('The download could not start.', { exact: false })).toBeVisible();
  await expect(dialog.getByRole('link', { name: 'Open full image' })).toHaveAttribute('href', /^blob:/);
  await dialog.getByRole('button', { name: 'Copy summary', exact: true }).click();
  await expect(dialog.getByRole('textbox', { name: 'Split summary to copy' })).toBeFocused();
  await expect(dialog.getByRole('textbox', { name: 'Split summary to copy' })).toHaveValue(/256\.25/);
});

test('twenty people and long names keep their shares readable on a small phone', async ({ page }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 320, height: 844 });
  await demoReview(page);
  await page.getByRole('button', { name: 'Looks good. Who’s in?' }).click();
  const names = ['Alexandria Catherine Montgomery', ...Array.from({ length: 14 }, (_, i) => `Dinner friend ${i + 1}`)];
  for (const name of names) {
    await page.getByLabel('Person’s name').fill(name);
    await page.getByLabel('Person’s name').press('Enter');
  }
  await page.getByRole('button', { name: 'That’s everyone' }).click();
  await page.getByRole('button', { name: 'Share all 10 remaining items' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Yes, these are for the table' }).click();
  await page.getByRole('button', { name: 'On to the finishing touches' }).click();
  await page.getByRole('button', { name: 'Calculate everyone’s share' }).click();
  await expect(page.locator('.person-result-summary')).toHaveCount(20);
  await expect(page.locator('.person-result-name').filter({ hasText: names[0] })).toBeVisible();
  await noHorizontalOverflow(page);
  await page.getByRole('button', { name: 'Share results', exact: true }).click();
  const preview = page.getByRole('region', { name: 'Share card preview. Scroll to see the whole image.' });
  const image = preview.locator('img');
  await expect(image).toBeVisible();
  expect(await image.evaluate((img: HTMLImageElement) => [img.naturalWidth, img.naturalHeight])).toEqual([1080, 3070]);
  expect(await preview.evaluate(element => element.scrollHeight > element.clientHeight)).toBe(true);
  expect(await image.evaluate(element => element.clientWidth)).toBeGreaterThan(240);
  await noHorizontalOverflow(page);
  await page.screenshot({ path: 'docs/qa/results-share-20-people-320.png' });
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('dialog').getByRole('button', { name: 'Save image', exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('north-ember-split.png');
  expect(await download.failure()).toBeNull();
});

test('extras distinguish receipt charges, optional tip math and allocation choice', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await tableExtras(page);
  await expect(page.locator('.extras-receipt-total')).toContainText('$225.50');
  await expect(page.locator('.extras-ledger-row.included')).toContainText('adds nothing extra');
  await expect(page.locator('.tip-basis')).toContainText('$205.00');
  await page.getByRole('radio', { name: '15%', exact: true }).click();
  await expect(page.locator('.tip-basis')).toHaveText('15% of $205.00 in items = $30.75.');
  await expect(page.locator('.final-total-preview')).toContainText('$256.25');
  await page.locator('.distribution-details > summary').click();
  await page.getByRole('checkbox', { name: /Split extras evenly instead/ }).check();
  await expect(page.locator('.distribution-details > summary')).toContainText('shared equally');
  await page.getByRole('radio', { name: 'Custom', exact: true }).click();
  await page.getByLabel('Custom tip amount (AUD)').fill('oops');
  await expect(page.getByRole('button', { name: 'Calculate everyone’s share' })).toBeDisabled();
  await page.getByRole('radio', { name: 'None', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Calculate everyone’s share' })).toBeEnabled();
  await noHorizontalOverflow(page);
  await page.screenshot({ path: 'docs/qa/extras-polish-320.png', fullPage: true });
  const audit = await new AxeBuilder({ page }).include('.extras-screen').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(audit.violations).toEqual([]);
});
