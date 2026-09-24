import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const baseURL = process.env.CAPTURE_URL || 'http://127.0.0.1:5173/';
const folder = new URL('../episode/screenshots/', import.meta.url);
await mkdir(folder, { recursive: true });
const browser = await chromium.launch({ channel: 'chromium' });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
const page = await context.newPage();
const evidence = { baseURL, checkedAt: new Date().toISOString(), stages: [], errors: [], download: null };
page.on('pageerror', error => evidence.errors.push(error.message));
page.on('console', message => { if (message.type() === 'error') evidence.errors.push(message.text()); });
async function capture(stage) {
  await page.waitForTimeout(250);
  const checks = [];
  for (const width of [320, 360, 375, 390, 430, 1440]) {
    await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
    const fits = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);
    checks.push({ width, fits });
    assert(fits, `${stage} overflows at ${width}px`);
    if ([390, 1440].includes(width)) await page.screenshot({ path: new URL(`${stage}-${width}.png`, folder).pathname.replace(/^\/(\w:)/, '$1') });
  }
  await page.setViewportSize({ width: 390, height: 844 });
  const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  evidence.stages.push({ stage, checks, accessibility: audit.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(n => ({ target: n.target, failureSummary: n.failureSummary })) })) });
}
try {
  await page.goto(baseURL);
  await capture('01-home');
  await page.getByRole('button', { name: 'Scan receipt', exact: true }).click();
  await capture('02-capture');
  await page.getByRole('button', { name: 'Go back', exact: true }).click();
  await page.getByRole('button', { name: 'Try demo', exact: true }).click();
  await page.getByRole('button', { name: 'Check 10 items' }).click();
  await capture('03-review');
  await page.getByRole('button', { name: 'Looks good. Who’s in?' }).click();
  await capture('04-people');
  await page.getByRole('button', { name: 'That’s everyone' }).click();
  const choices = [['Everyone'], ['Everyone'], ['You'], ['Maya'], ['Leo'], ['You', 'Maya', 'Nina'], ['Nina', 'Theo'], ['Nina', 'Theo'], ['Everyone'], ['You', 'Leo']];
  for (const [index, names] of choices.entries()) {
    const card = page.locator('.assignment-card').nth(index);
    for (const name of names) {
      if (name === 'Everyone') await card.locator('.everyone-chip').click();
      else await card.getByRole('button', { name, exact: true }).click();
    }
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await capture('05-assign');
  await page.locator('.assignment-card').last().scrollIntoViewIfNeeded();
  await page.screenshot({ path: new URL('05-assign-sticky.png', folder).pathname.replace(/^\/(\w:)/, '$1') });
  const bounds = await page.locator('.assignment-dashboard').boundingBox();
  assert(bounds.y >= -1 && bounds.y < 10, 'Running totals should stay at the top while scrolling');
  await page.getByRole('button', { name: 'On to the finishing touches' }).click();
  await capture('06-extras');
  await page.getByRole('button', { name: 'Calculate everyone’s share' }).click();
  await capture('07-results');
  const amounts = await page.locator('.person-result-summary > .number-ticker > .sr-only').allTextContents();
  assert.deepEqual(amounts, ['$71.50', '$42.90', '$53.90', '$30.80', '$26.40']);
  await page.getByRole('button', { name: 'Share results', exact: true }).click();
  await page.locator('.share-card-preview img').waitFor();
  await capture('08-share');
  const image = page.locator('.share-card-preview img');
  evidence.download = await image.evaluate(img => ({ width: img.naturalWidth, height: img.naturalHeight }));
  const bytes = await image.evaluate(async img => Array.from(new Uint8Array(await (await fetch(img.src)).arrayBuffer())));
  await writeFile(new URL('share-card.png', folder), Buffer.from(bytes));
  assert.deepEqual(evidence.errors, []);
} finally {
  await writeFile(new URL('../docs/qa/release-visual.json', import.meta.url), JSON.stringify(evidence, null, 2));
  await browser.close();
}
console.log(JSON.stringify(evidence, null, 2));
if (evidence.stages.some(stage => stage.accessibility.length)) process.exitCode = 1;
