/** Copy build-time dependencies into same-origin static assets. Never fetch at runtime. */
import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'public/ocr');
const modules = path.join(root, 'node_modules');
async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return (await Promise.all(entries.map(async entry => entry.isDirectory() ? walk(path.join(dir, entry.name)) : [path.join(dir, entry.name)]))).flat();
}
try {
  const sourceWorker = path.join(modules, 'tesseract.js/dist/worker.min.js');
  await stat(sourceWorker);
  const coreRoot = path.join(modules, 'tesseract.js-core');
  const core = (await readdir(coreRoot)).filter(name => /^tesseract-core.*\.wasm(?:\.js)?$/.test(name));
  for (const variant of ['', '-simd', '-lstm', '-simd-lstm']) {
    for (const extension of ['.wasm', '.wasm.js']) {
      if (!core.includes(`tesseract-core${variant}${extension}`)) throw new Error(`Missing OCR core: tesseract-core${variant}${extension}`);
    }
  }
  const languages = await walk(path.join(modules, '@tesseract.js-data/eng'));
  const candidates = languages.filter(file => path.basename(file) === 'eng.traineddata.gz');
  const language = candidates.find(file => file.includes('4.0.0_best_int')) ?? candidates[0];
  if (!language) throw new Error('English traineddata is missing from @tesseract.js-data/eng.');
  await rm(output, { recursive: true, force: true });
  await mkdir(path.join(output, 'core'), { recursive: true });
  await mkdir(path.join(output, 'lang'), { recursive: true });
  await cp(sourceWorker, path.join(output, 'worker.min.js'));
  for (const name of core) await cp(path.join(coreRoot, name), path.join(output, 'core', name));
  await cp(language, path.join(output, 'lang/eng.traineddata.gz'));
  // Preserve the upstream notices alongside the redistributed worker/WASM/data.
  for (const [folder, prefix] of [['tesseract.js', 'tesseract'], ['tesseract.js-core', 'core'], ['@tesseract.js-data/eng', 'english']]) {
    for (const name of await readdir(path.join(modules, folder))) {
      if (/^(license|notice|copying)/i.test(name) && (await stat(path.join(modules, folder, name))).isFile()) {
        await cp(path.join(modules, folder, name), path.join(output, `${prefix}-${name}`));
      }
    }
  }
  const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
  await writeFile(path.join(output, 'manifest.json'), JSON.stringify({
    tesseract: pkg.dependencies['tesseract.js'], core: pkg.dependencies['tesseract.js-core'],
    language: 'eng', persistentOcrCache: false, coreFiles: core, runtimeOrigin: 'self',
  }, null, 2));
  console.log(`Local OCR assets ready: worker, ${core.length} core files, English data. No CDN required.`);
} catch (error) {
  console.error(`Cannot prepare local OCR assets. Run npm install first.\n${error.message}`);
  process.exitCode = 1;
}
