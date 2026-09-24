import { test, expect, type Page } from '@playwright/test';
import { demoReview, noHorizontalOverflow } from './helpers.ts';

async function people(page: Page) {
  await demoReview(page);
  await page.getByRole('button', { name:'Looks good. Who’s in?' }).click();
}
async function assign(page: Page) {
  await people(page);
  await page.getByRole('button', { name:'That’s everyone' }).click();
}

test('claim queue keeps an item while choosing sharers; refresh and search are explicit', async ({ page }) => {
  await assign(page);
  await page.getByRole('button', { name:/^To claim/ }).click();
  const burrata = page.getByRole('article', { name:'Burrata', exact:true });
  await burrata.getByRole('button', { name:'You', exact:true }).click();
  await expect(burrata).toBeVisible();
  await burrata.getByRole('button', { name:'Maya', exact:true }).click();
  await expect(burrata).toContainText('$9.00 each');
  await expect(page.locator('.assignment-card')).toHaveCount(10);
  await page.getByRole('button', { name:'Refresh list', exact:true }).click();
  await expect(page.locator('.assignment-card')).toHaveCount(9);
  await expect(burrata).toHaveCount(0);
  await page.getByLabel('Find an item', { exact:true }).fill('not on this receipt');
  await expect(page.getByText('No dish by that name.')).toBeVisible();
  await page.getByRole('button', { name:'Clear filters', exact:true }).click();
  await expect(page.locator('.assignment-card')).toHaveCount(10);
  await expect(burrata.getByRole('button', { name:'You', exact:true })).toHaveAttribute('aria-pressed','true');
  await expect(burrata.getByRole('button', { name:'Maya', exact:true })).toHaveAttribute('aria-pressed','true');
});

test('Find next clears search and moves keyboard focus through unclaimed dishes', async ({ page }) => {
  await assign(page);
  await page.getByLabel('Find an item', { exact:true }).fill('Tiramisu');
  await expect(page.locator('.assignment-card')).toHaveCount(1);
  await page.getByRole('button', { name:'Find next', exact:true }).click();
  await expect(page.getByRole('heading', { name:'Burrata', exact:true })).toBeFocused();
  await expect(page.getByLabel('Find an item', { exact:true })).toHaveValue('');
  await page.getByRole('button', { name:'Find next', exact:true }).click();
  await expect(page.getByRole('heading', { name:'Sourdough', exact:true })).toBeFocused();
});

test('removing then undoing a person restores their claims, and rename keeps them', async ({ page }) => {
  await assign(page);
  const burrata = page.getByRole('article', { name:'Burrata', exact:true });
  await burrata.getByRole('button', { name:'You', exact:true }).click();
  await burrata.getByRole('button', { name:'Maya', exact:true }).click();
  await page.locator('.assignment-people-link').click();
  await page.getByRole('button', { name:'Remove You', exact:true }).click();
  const undo = page.getByRole('button', { name:'Undo removal of You', exact:true });
  await expect(undo).toBeFocused();
  await undo.press('Enter');
  await expect(page.getByRole('button', { name:'Rename You', exact:true })).toBeFocused();
  await page.getByRole('button', { name:'Rename You', exact:true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Name', { exact:true }).fill('Alex');
  await dialog.getByRole('button', { name:'Save name', exact:true }).click();
  await page.getByRole('button', { name:'That’s everyone' }).click();
  await expect(burrata.getByRole('button', { name:'Alex', exact:true })).toHaveAttribute('aria-pressed','true');
  await expect(burrata.getByRole('button', { name:'Maya', exact:true })).toHaveAttribute('aria-pressed','true');
  await expect(burrata).toContainText('$9.00 each');
});

test('large table picker preserves multiple selections across search and keyboard actions', async ({ page }) => {
  await people(page);
  for (const name of ['Ada','Bea','Cam']) {
    await page.getByLabel('Person’s name').fill(name);
    await page.getByLabel('Person’s name').press('Enter');
  }
  await page.getByRole('button', { name:'That’s everyone' }).click();
  const burrata = page.getByRole('article', { name:'Burrata', exact:true });
  await burrata.getByRole('button', { name:'Choose people for Burrata', exact:true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Find a person', { exact:true }).fill('Cam');
  await dialog.getByRole('button', { name:'Cam', exact:true }).focus();
  await page.keyboard.press('Space');
  await expect(dialog.getByRole('button', { name:'Cam', exact:true })).toHaveAttribute('aria-pressed','true');
  await dialog.getByLabel('Find a person', { exact:true }).fill('You');
  await dialog.getByRole('button', { name:'You', exact:true }).press('Enter');
  await expect(dialog.getByText('2 people selected · $9.00 each')).toBeVisible();
  await dialog.getByRole('button', { name:'Done choosing people', exact:true }).click();
  await expect(burrata).toContainText('You, Cam');
  await expect(burrata).toContainText('$9.00 each');
  await burrata.getByRole('button', { name:'Clear people from Burrata', exact:true }).click();
  await expect(burrata).toHaveAttribute('data-unassigned','true');
});

test('twenty people with long names fit 320px and remain accessible in the picker', async ({ page }) => {
  await page.setViewportSize({ width:320, height:720 });
  await people(page);
  for (let i = 1; i <= 15; i++) {
    await page.getByLabel('Person’s name').fill(`Guest ${String(i).padStart(2,'0')} Alexandria Longname`);
    await page.getByLabel('Person’s name').press('Enter');
  }
  await expect(page.getByLabel('Person’s name')).toBeDisabled();
  await expect(page.locator('.person-pill')).toHaveCount(20);
  await noHorizontalOverflow(page);
  await page.getByRole('button', { name:'That’s everyone' }).click();
  await noHorizontalOverflow(page);
  await page.getByRole('button', { name:'Choose people for Burrata', exact:true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Find a person', { exact:true }).fill('Guest 15');
  await dialog.getByRole('button', { name:'Guest 15 Alexandria Longname', exact:true }).click();
  await expect(dialog.getByText('1 person selected')).toBeVisible();
  await noHorizontalOverflow(page);
  await dialog.getByRole('button', { name:'Clear person search', exact:true }).click();
  const doneBounds = await dialog.getByRole('button', { name:'Done choosing people', exact:true }).boundingBox();
  expect(doneBounds!.y).toBeGreaterThanOrEqual(0);
  expect(doneBounds!.y + doneBounds!.height).toBeLessThanOrEqual(720);
  await dialog.getByRole('button', { name:'Done choosing people', exact:true }).click();
  await expect(page.getByRole('article', { name:'Burrata', exact:true })).toContainText('Guest 15 Alexandria Longname');
});

test('sharing remaining items preserves solo claims and clearing is reversible', async ({ page }) => {
  await assign(page);
  const burrata = page.getByRole('article', { name:'Burrata', exact:true });
  await burrata.getByRole('button', { name:'You', exact:true }).click();
  await page.getByRole('button', { name:'Share all 9 remaining items', exact:true }).click();
  await page.getByRole('dialog').getByRole('button', { name:'Yes, these are for the table', exact:true }).click();
  await expect(burrata.getByRole('button', { name:'Maya', exact:true })).toHaveAttribute('aria-pressed','false');
  await expect(page.getByRole('button', { name:'On to the finishing touches' })).toBeEnabled();
  await burrata.getByRole('button', { name:'Clear people from Burrata', exact:true }).click();
  await expect(page.getByRole('button', { name:'On to the finishing touches' })).toBeDisabled();
  await burrata.getByRole('button', { name:'You', exact:true }).click();
  await expect(page.getByRole('button', { name:'On to the finishing touches' })).toBeEnabled();
});
