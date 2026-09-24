/** Validate a real production build, including its initial import graph and asset budget. */
import { readFile, readdir, stat } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const dist = fileURLToPath(new URL('../dist/', import.meta.url));
function assert(condition, message) { if (!condition) throw new Error(message); }
try {
  const html = await readFile(path.join(dist, 'index.html'), 'utf8');
  assert(!html.includes('/src/main.tsx'), 'The source entry was not built.');
  assert(!/(?:src|href)=["']https?:\/\//.test(html), 'HTML pulls a remote asset.');
  const expectedBase = process.env.VITE_BASE || './';
  const urls = [...html.matchAll(/(?:src|href)=["']([^"']+)["']/g)].map(match => match[1]);
  for (const url of urls.filter(url => !url.startsWith('#') && !url.startsWith('data:'))) {
    assert(url.startsWith(expectedBase), `Asset is not base-safe (${expectedBase}): ${url}`);
    await stat(path.join(dist, url.slice(expectedBase.length)));
  }
  await stat(path.join(dist, 'ocr/worker.min.js'));
  await stat(path.join(dist, 'licenses/index.json'));
  await stat(path.join(dist, 'licenses/LICENSE'));
  await stat(path.join(dist, 'licenses/THIRD_PARTY_NOTICES.md'));
  await stat(path.join(dist, 'ocr/lang/eng.traineddata.gz'));
  for (const variant of ['', '-simd', '-lstm', '-simd-lstm']) for (const extension of ['.wasm', '.wasm.js']) await stat(path.join(dist, `ocr/core/tesseract-core${variant}${extension}`));
  const manifest = JSON.parse(await readFile(path.join(dist, '.vite/manifest.json'), 'utf8'));
  const entries = Object.entries(manifest).filter(([, value]) => value.isEntry);
  assert(entries.length > 0, 'No entry in Vite manifest.');
  const initial = new Set();
  function visit(key) { if (initial.has(key)) return; initial.add(key); for (const child of manifest[key]?.imports ?? []) visit(child); }
  for (const [entry] of entries) visit(entry);
  let bytes = 0;
  for (const key of initial) {
    const file = manifest[key].file;
    assert(!/ocr-engine|celebration/.test(file), `Lazy dependency leaked into initial graph: ${file}`);
    const source = await readFile(path.join(dist, file)); bytes += gzipSync(source).length;
  }
  assert(bytes < 350 * 1024, `Initial JS exceeds 350 KiB gzip budget: ${(bytes / 1024).toFixed(1)} KiB`);
  const files = await readdir(path.join(dist, 'assets'));
  for (const file of files.filter(file => file.endsWith('.css'))) {
    const css = await readFile(path.join(dist, 'assets', file), 'utf8');
    assert(!/url\(["']?data:(?:font\/|application\/(?:font|x-font|vnd\.ms-fontobject))/i.test(css), 'An inline font violates the production font-src CSP.');
  }
  assert(files.some(file => file.endsWith('.woff2')), 'Locally bundled fonts missing.');
  assert(files.some(file => file.includes('ocr-engine')), 'Lazy OCR chunk missing.');
  console.log(`Production checks passed. Initial JS: ${(bytes / 1024).toFixed(1)} KiB gzip. Base: ${expectedBase}. OCR/fonts are same-origin.`);
} catch (error) { console.error(`Production check failed: ${error.message}`); process.exitCode = 1; }
