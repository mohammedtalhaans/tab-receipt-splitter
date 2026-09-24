/** Preserve notices for all installed production dependencies in the static release. */
import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.resolve(root, 'public/licenses');
const expectedOutput = path.join(path.resolve(root), 'public', 'licenses');
if (output !== expectedOutput) throw new Error('License output must stay in public/licenses.');
const noticeName = /^(?:licen[cs]e|notice|copying|ofl)(?:[._-].*|$)/i;

async function collect(folder, relative = '') {
  const files = [];
  for (const entry of await readdir(path.join(folder, relative), { withFileTypes: true })) {
    if (entry.isSymbolicLink()) continue;
    const next = path.join(relative, entry.name);
    if (entry.isDirectory() && !['node_modules', '.git'].includes(entry.name)) files.push(...await collect(folder, next));
    else if (entry.isFile() && noticeName.test(entry.name)) files.push(next);
  }
  return files.sort();
}

try {
  const lock = JSON.parse(await readFile(path.join(root, 'package-lock.json'), 'utf8'));
  if (!lock.packages) throw new Error('A package-lock with package entries is required.');
  const packages = [];
  const missing = [];
  for (const [location, entry] of Object.entries(lock.packages).sort(([a], [b]) => a.localeCompare(b))) {
    if (!location || entry.dev || !location.startsWith('node_modules/')) continue;
    const folder = path.resolve(root, location);
    if (!folder.startsWith(path.join(path.resolve(root), 'node_modules') + path.sep)) throw new Error(`Unsafe package location: ${location}`);
    let metadata;
    try { metadata = JSON.parse(await readFile(path.join(folder, 'package.json'), 'utf8')); }
    catch (error) { if (error.code === 'ENOENT' && entry.optional) continue; throw error; }
    let files = await collect(folder);
    let noticeFolder = folder;
    let noticeSource = 'installed package';
    // Some upstream npm archives omit their license; preserve checked source notices.
    if (!files.length && metadata.name?.startsWith('@radix-ui/')) {
      noticeFolder = path.join(root, 'node_modules/@radix-ui/react-dialog');
      files = ['LICENSE'];
      noticeSource = 'Installed @radix-ui/react-dialog LICENSE; same radix-ui/primitives repository';
    }
    const supplemental = { '@tesseract.js-data/eng': 'tessdata-LICENSE', 'react-remove-scroll-bar': 'react-remove-scroll-bar-LICENSE', tr46: 'tr46-LICENSE.md' }[metadata.name];
    if (!files.length && supplemental) {
      noticeFolder = path.join(root, 'docs/licenses');
      files = [supplemental];
      noticeSource = 'Checked upstream source notice; see SOURCE-NOTICES.md';
    }
    if (!files.length) missing.push(metadata.name ?? location);
    packages.push({ name: metadata.name, version: metadata.version, license: metadata.license ?? entry.license ?? null,
      location, folder: noticeFolder, files, noticeSource });
  }
  if (missing.length) throw new Error(`Production packages have no license/notice file: ${missing.join(', ')}`);
  await rm(output, { recursive: true, force: true });
  await mkdir(output, { recursive: true });
  const manifest = { description: 'License and notice files from installed production dependencies. Paths are relative to this directory.', packages: [] };
  for (const pkg of packages) {
    const relativeBase = pkg.location.replace(/^node_modules\//, '').replaceAll('/node_modules/', '/_nested_/');
    const files = [];
    for (const relative of pkg.files) {
      const target = path.join(relativeBase, relative);
      await mkdir(path.dirname(path.join(output, target)), { recursive: true });
      await cp(path.join(pkg.folder, relative), path.join(output, target));
      files.push(target.split(path.sep).join('/'));
    }
    manifest.packages.push({ name: pkg.name, version: pkg.version, declaredPackageLicense: pkg.license, noticeSource: pkg.noticeSource, files });
  }
  for (const name of ['LICENSE', 'THIRD_PARTY_NOTICES.md']) await cp(path.join(root, name), path.join(output, name));
  await cp(path.join(root, 'docs/licenses/SOURCE-NOTICES.md'), path.join(output, 'SOURCE-NOTICES.md'));
  await writeFile(path.join(output, 'index.json'), JSON.stringify(manifest, null, 2) + '\n');
  await writeFile(path.join(output, 'README.txt'), 'tab redistribution notices\n\nindex.json lists production packages and their preserved license/notice files.\nLICENSE covers original tab code. THIRD_PARTY_NOTICES.md includes adapted-component notices.\nFont license files are included under the @fontsource and @fontsource-variable directories.\n');
  console.log(`Static license notices ready: ${packages.length} production packages, project license, adapted-component notices, and font licenses.`);
} catch (error) {
  console.error(`Cannot prepare redistribution notices: ${error.message}`);
  process.exitCode = 1;
}
