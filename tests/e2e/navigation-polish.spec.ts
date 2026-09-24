import { test, expect } from '@playwright/test';
import { demoReview } from './helpers.ts';

test('mobile starts immediately with scan, demo and manual entry above the illustration', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.goto('./');
  const scan = await page.getByRole('button', { name: 'Scan receipt', exact: true }).boundingBox();
  const manual = await page.getByRole('button', { name: 'Enter items manually', exact: true }).boundingBox();
  const art = await page.locator('.hero-visual').boundingBox();
  expect(scan!.y + scan!.height).toBeLessThan(640);
  expect(manual!.y + manual!.height).toBeLessThan(art!.y);
  await page.getByRole('button', { name: 'Enter items manually', exact: true }).click();
  await expect(page.locator('.review-screen')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add your first item', exact: true })).toBeVisible();
});

test('browser Back and Forward retain the receipt and table without putting their data in history', async ({ page }) => {
  await demoReview(page);
  await page.getByRole('button', { name: 'Looks good. Who’s in?' }).click();
  await page.getByRole('button', { name: 'That’s everyone' }).click();
  await page.goBack();
  await expect(page.locator('.people-screen')).toBeVisible();
  await page.goBack();
  await expect(page.locator('.review-item')).toHaveCount(10);
  await page.goForward();
  await expect(page.locator('.people-screen')).toBeVisible();
  await expect(page.locator('.person-pill')).toHaveCount(5);
  const entry = await page.evaluate(() => history.state);
  expect(Object.keys(entry.tabFlow).sort()).toEqual(['index', 'session', 'stage']);
  expect(JSON.stringify(entry)).not.toMatch(/NORTH|Maya|225\.50|Burrata/);
});

test('browser Back dismisses a receipt editor before going to an earlier screen', async ({ page }) => {
  await demoReview(page);
  await page.locator('.review-item-main').first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('.review-item')).toHaveCount(10);
  await expect(page.locator('.review-item-main').first()).toBeFocused();
  await expect.poll(() => page.evaluate(() => history.state.tabFlow.stage)).toBe('review');
  await page.goBack();
  await expect(page.locator('.capture-screen')).toBeVisible();
});

test('browser Back from an unsaved edit retains the draft and offers a deliberate discard', async ({ page }) => {
  await demoReview(page);
  await page.locator('.review-item-main').first().click();
  await page.getByRole('dialog').getByLabel('Item name', { exact: true }).fill('Draft dish');
  await page.goBack();
  await expect(page.getByRole('button', { name: 'Keep editing', exact: true })).toBeVisible();
  await expect(page.getByLabel('Item name', { exact: true })).toHaveValue('Draft dish');
  await page.getByRole('button', { name: 'Discard changes', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('.review-item').first()).toContainText('Burrata');
});

test('the first-screen privacy sheet also closes with browser Back', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'About and privacy', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('.home-screen')).toBeVisible();
  await expect(page.getByRole('button', { name: 'About and privacy', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Scan receipt', exact: true }).click();
  await expect(page.locator('.capture-screen')).toBeVisible();
  await page.getByRole('button', { name: 'Go back', exact: true }).click();
  await expect(page.locator('.home-screen')).toBeVisible();
});

test('returning home offers the current split; starting fresh clears its old navigation', async ({ page }) => {
  await demoReview(page);
  await page.goBack();
  await expect(page.locator('.capture-screen')).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('button', { name: 'Continue this split', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Continue this split', exact: true }).click();
  await expect(page.locator('.review-item')).toHaveCount(10);
  await page.getByRole('button', { name: 'tab home', exact: true }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Start a fresh split', exact: true }).click();
  await expect(page.locator('.home-screen')).toBeVisible();
  await expect.poll(() => page.evaluate(() => history.state.tabFlow.index)).toBe(0);
  await expect(page.getByRole('button', { name: 'Continue this split', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Enter items manually', exact: true }).click();
  await expect(page.locator('.review-item')).toHaveCount(0);
});

test('the progress picker jumps to earlier stages and guards unavailable results', async ({ page }) => {
  await demoReview(page);
  await page.getByRole('button', { name: 'Looks good. Who’s in?' }).click();
  await page.getByRole('button', { name: /Your progress:/ }).click();
  await expect(page.getByRole('dialog').getByRole('button', { name: /All sorted/ })).toBeDisabled();
  await page.getByRole('dialog').getByRole('button', { name: /Check the items/ }).click();
  await expect(page.locator('.review-item')).toHaveCount(10);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('[data-stage="review"] [data-stage-heading]')).toBeFocused();
});
