import { test, expect } from '@playwright/test';

for (const exit of ['tab home', 'Go back']) {
  test(`${exit} cancels sample playback without repopulating a discarded receipt`, async ({ page }) => {
    await page.clock.install();
    await page.goto('./');
    await page.getByRole('button', { name: 'Try demo', exact: true }).click();
    await expect(page.locator('.processing-screen')).toBeVisible();
    await page.getByRole('button', { name: exit, exact: true }).click();

    // Advance past the entire saved-OCR playback to expose stale SCAN_DONE updates.
    await page.clock.runFor(2_000);
    if (exit === 'tab home') {
      await expect(page.locator('.home-screen')).toBeVisible();
      await page.getByRole('button', { name: 'Scan receipt', exact: true }).click();
    } else {
      await expect(page.locator('.capture-screen')).toBeVisible();
    }

    // A leaked receipt would cause this click to open the destructive-reset dialog.
    await page.getByRole('button', { name: 'tab home', exact: true }).click();
    await expect(page.locator('.home-screen')).toBeVisible();
    await expect(page.getByRole('alertdialog')).toHaveCount(0);
  });
}
