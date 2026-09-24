import { expect, type Page } from '@playwright/test';
export async function demoReview(page: Page) {

  await page.goto('./');

  await page.getByRole('button', { name: 'Try demo', exact: true }).click();

  await page.getByRole('button', { name: 'Check 10 items' }).click();

  await expect(page.locator('.review-item')).toHaveCount(10);
}
export async function demoResults(page: Page) {

  await demoReview(page);

  await page.getByRole('button', { name: 'Looks good. Who’s in?' }).click();

  await page.getByRole('button', { name: 'That’s everyone' }).click();

  const choices = [['Everyone'], ['Everyone'], ['You'], ['Maya'], ['Leo'], ['You', 'Maya', 'Nina'], ['Nina', 'Theo'], ['Nina', 'Theo'], ['Everyone'], ['You', 'Leo']];

  for (const [index, names] of choices.entries()) {

    const card = page.locator('.assignment-card').nth(index);

    for (const name of names) {

      if (name === 'Everyone') await card.locator('.everyone-chip').click();
      else await card.getByRole('button', { name, exact: true }).click();

    }

  }

  await page.getByRole('button', { name: 'On to the finishing touches' }).click();

  await page.getByRole('radio', { name: '15%', exact: true }).click();

  await page.getByRole('button', { name: 'Calculate everyone’s share' }).click();

  await expect(page.locator('.result-heading h1')).toContainText('$256.25');
}
export async function noHorizontalOverflow(page: Page) {

  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
}
