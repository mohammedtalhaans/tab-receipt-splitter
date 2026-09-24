import { test, expect, type Page } from '@playwright/test';
import { demoReview, noHorizontalOverflow } from './helpers.ts';

async function manualReview(page: Page) {
  await page.goto('./');
  await page.getByRole('button', { name: 'Scan receipt', exact: true }).click();
  await page.locator('.capture-screen').getByRole('button', { name: 'Enter items manually', exact: true }).click();
  await page.getByRole('button', { name: 'Add your first item', exact: true }).click();
  await expect(page.getByRole('dialog').getByLabel('Item name', { exact: true })).toBeFocused();
}

async function twoItems(page: Page) {
  await manualReview(page);
  const editor = page.getByRole('dialog');
  await editor.getByLabel('Item name', { exact: true }).fill('Coffee');
  await editor.getByLabel('Item name', { exact: true }).press('Enter');
  await expect(editor.getByLabel(/Line total/)).toBeFocused();
  await editor.getByLabel('Quantity', { exact: true }).fill('2');
  await editor.getByLabel(/Line total/).fill('8.00');
  await editor.getByRole('button', { name: 'Add and add another', exact: true }).click();
  await expect(editor.getByRole('status')).toContainText('Coffee added');
  await expect(editor.getByLabel('Item name', { exact: true })).toBeFocused();
  await expect(editor.getByLabel(/Line total/)).toHaveValue('');
  await expect(editor.getByLabel('Quantity', { exact: true })).toHaveValue('1');
  await editor.getByLabel('Item name', { exact: true }).fill('Cake');
  await editor.getByLabel(/Line total/).fill('4.51');
  await editor.getByRole('button', { name: 'Add item', exact: true }).click();
}

test('manual entry adds successive items quickly and keeps quantity separate from line price', async ({ page }) => {
  await twoItems(page);
  await expect(page.locator('.review-item')).toHaveCount(2);
  await expect(page.locator('.review-item').first()).toContainText('2 UNITS · PRICE FOR ALL 2');
  await expect(page.locator('.subtotal-row')).toContainText('$12.51');
  await expect(page.getByRole('button', { name: 'Looks good. Who’s in?', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Use the checked item sum', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('$12.51');
  await page.getByRole('button', { name: 'Yes, that’s the receipt total', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Looks good. Who’s in?', exact: true })).toBeEnabled();
});

test('closing an unsaved item lets the user keep the draft or discard it', async ({ page }) => {
  await manualReview(page);
  const editor = page.getByRole('dialog');
  await editor.getByLabel('Item name', { exact: true }).fill('Unsaved coffee');
  await editor.getByRole('button', { name: 'Close dialog', exact: true }).click();
  await expect(editor.getByRole('button', { name: 'Keep editing', exact: true })).toBeFocused();
  await editor.getByRole('button', { name: 'Keep editing', exact: true }).click();
  await expect(editor.getByLabel('Item name', { exact: true })).toHaveValue('Unsaved coffee');
  await editor.getByRole('button', { name: 'Close dialog', exact: true }).click();
  await editor.getByRole('button', { name: 'Discard changes', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('.review-item')).toHaveCount(0);
});

test('browser Back protects an unsaved item and keeps the review screen underneath', async ({ page }) => {
  await manualReview(page);
  const editor = page.getByRole('dialog');
  await editor.getByLabel('Item name', { exact: true }).fill('Coffee draft');
  await page.goBack();
  await expect(editor.getByRole('button', { name: 'Keep editing', exact: true })).toBeVisible();
  await editor.getByRole('button', { name: 'Keep editing', exact: true }).click();
  await expect(editor.getByLabel('Item name', { exact: true })).toHaveValue('Coffee draft');
  await expect(page.locator('.review-screen')).toBeAttached();
});

test('invalid manual price keeps the draft and focuses the amount to correct', async ({ page }) => {
  await manualReview(page);
  const editor = page.getByRole('dialog');
  await editor.getByLabel('Item name', { exact: true }).fill('Coffee');
  await editor.getByLabel(/Line total/).fill('-4.50');
  await editor.getByRole('button', { name: 'Add item', exact: true }).click();
  await expect(editor.getByRole('alert')).toContainText('Enter a valid price');
  await expect(editor.getByLabel(/Line total/)).toBeFocused();
  await expect(editor.getByLabel(/Line total/)).toHaveAttribute('aria-invalid', 'true');
  await editor.getByLabel(/Line total/).fill('4.50');
  await editor.getByRole('button', { name: 'Add item', exact: true }).click();
  await expect(page.locator('.review-item')).toContainText('$4.50');
});

test('a combined amount beyond the supported limit stays editable instead of crashing', async ({ page }) => {
  await manualReview(page);
  const editor = page.getByRole('dialog');
  await editor.getByLabel('Item name', { exact: true }).fill('Large booking');
  await editor.getByLabel(/Line total/).fill('999999.00');
  await editor.getByRole('button', { name: 'Add and add another', exact: true }).click();
  await editor.getByLabel('Item name', { exact: true }).fill('Extra item');
  await editor.getByLabel(/Line total/).fill('2.00');
  await editor.getByRole('button', { name: 'Add item', exact: true }).click();
  await expect(editor.getByRole('alert')).toContainText('combined receipt is too large');
  await expect(editor.getByLabel(/Line total/)).toBeFocused();
  await expect(editor.getByLabel('Item name', { exact: true })).toHaveValue('Extra item');
  await expect(page.locator('.fatal-error')).toHaveCount(0);
});

test('a printed-total mismatch stays blocked until the actual line price is corrected', async ({ page }) => {
  await twoItems(page);
  await page.getByRole('button', { name: 'Check printed receipt total', exact: true }).click();
  await page.getByRole('dialog').getByLabel('Printed receipt total', { exact: true }).fill('12.50');
  await expect(page.locator('.receipt-total-difference')).toContainText('$0.01 to resolve');
  await page.getByRole('button', { name: 'Save receipt details', exact: true }).click();
  await expect(page.locator('.reconciliation')).toContainText('$0.01');
  await expect(page.locator('.subtotal-row')).toContainText('$12.51');
  await expect(page.getByRole('button', { name: 'Looks good. Who’s in?', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Edit Coffee, $8.00', exact: true }).click();
  await page.getByRole('dialog').getByLabel(/Line total/).fill('7.99');
  await page.getByRole('button', { name: 'Save correction', exact: true }).click();
  await expect(page.locator('.reconciliation')).toContainText('Total confirmed');
  await expect(page.locator('.subtotal-row')).toContainText('$12.50');
  await expect(page.getByRole('button', { name: 'Looks good. Who’s in?', exact: true })).toBeEnabled();
});

test('receipt comparison is available above the items and supports zoom without page overflow', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 780 });
  await demoReview(page);
  await expect(page.locator('.review-overview')).toContainText('$225.50');
  await page.getByRole('button', { name: 'Compare photo', exact: true }).click();
  const viewer = page.locator('.receipt-photo-viewer');
  await expect(viewer.locator('img')).toBeVisible();
  await page.getByRole('button', { name: 'Zoom in', exact: true }).click();
  await expect.poll(() => viewer.evaluate(element => element.scrollWidth > element.clientWidth)).toBe(true);
  await noHorizontalOverflow(page);
  await page.getByRole('button', { name: 'Fit photo', exact: true }).click();
  await expect.poll(() => viewer.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
  await page.getByRole('button', { name: 'Back to the items', exact: true }).click();
  await expect(page.locator('.review-item')).toHaveCount(10);
});
