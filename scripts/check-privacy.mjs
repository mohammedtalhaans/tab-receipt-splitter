/** Static guardrail, not a substitute for the Playwright network audit. */
import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const files = (await readdir(path.join(root, 'src'), { recursive: true })).filter(file => /\.(ts|tsx)$/.test(file));
const forbidden = [
  ['persistent session storage', /\b(localStorage|sessionStorage|indexedDB)\b/],
  ['network write', /(?:method\s*:\s*['"](?:POST|PUT|PATCH|DELETE)|\.sendBeacon\s*\()/i],
  ['remote fetch', /fetch\s*\(\s*['"`]https?:\/\//i],
  ['HTML injection', /dangerouslySetInnerHTML/],
  ['analytics or backend SDK', /from\s*['"](?:firebase|@supabase|posthog|@sentry|openai)/],
];
const failures = [];
for (const name of files) {
  const source = await readFile(path.join(root, 'src', name), 'utf8');
  for (const [label, pattern] of forbidden) if (pattern.test(source)) failures.push(`${name}: ${label}`);
}
const html = await readFile(path.join(root, 'index.html'), 'utf8');
if (!html.includes("connect-src 'self'") || !html.includes("form-action 'none'")) failures.push('Missing restrictive production CSP.');
const ocr = await readFile(path.join(root, 'src/features/ocr/recognize.ts'), 'utf8');
for (const expected of ["assetUrl('ocr/worker.min.js')", "assetUrl('ocr/core')", "assetUrl('ocr/lang')", "cacheMethod: 'none'", "workerBlobURL: false"])
  if (!ocr.includes(expected)) failures.push(`OCR safeguard missing: ${expected}`);
if (failures.length) { console.error(failures.join('\n')); process.exitCode = 1; }
else console.log(`Privacy source audit passed across ${files.length} modules: no network writes, remote fetches, persistence, or analytics SDKs. Browser network testing is still required.`);
