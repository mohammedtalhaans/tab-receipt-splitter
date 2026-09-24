# Publish tab. on GitHub Pages

The app builds to static files and needs no backend, API key, or paid service. The included workflow builds and tests the app before publishing. A live deployment has not been created from this delivery.

1. Create a GitHub repository, for example `tab-receipt-splitter`, with `main` as its default branch.
2. Put the **contents of this project folder** at the repository root. Include the hidden `.github` folder and `package-lock.json`. Do not upload `node_modules`, `dist`, or generated `public/ocr` and `public/licenses` files; the build creates them.
3. Open **Settings → Pages → Build and deployment → Source** and select **GitHub Actions**.
4. Push the source to `main`, or open **Actions → Verify and deploy tab → Run workflow**.
5. Wait for both **verify** and **deploy** to turn green. Open the URL under **Deployments → github-pages** and run the short smoke check below before sharing it.

The workflow automatically sets the correct `/<repository-name>/` path, including local OCR files and fonts. A repository named `<username>.github.io` uses `/`. For a custom domain, set **Settings → Secrets and variables → Actions → Variables → `VITE_BASE`** to `/` and configure the domain in Pages settings.

No secrets are required. GitHub supplies the deployment token. The workflow permits deployment only from `main`; pull requests are tested without publishing. If your default branch has another name, change the branch names in `.github/workflows/pages.yml`.

## Check before filming

- Open the actual HTTPS URL on your phone. Run **Try demo** through review, people, item assignment, extras, results, and sharing.
- Scan a clear non-sensitive receipt. Check its recognized prices and printed total before continuing. Test a correction.
- Generate the share card and try the phone's share/save action. Clipboard and native sharing depend on browser permissions and support.
- Choose **Copy share link** and open it in a fresh browser tab. Confirm it shows the people, item assignments, charges, and exact results as a view-only split. The fragment contains no receipt photo.
- Reload the page: the previous receipt and people should disappear.

Physical phone cameras, native share sheets, and in-app browsers still need this on-device check. Local automated tests do not establish those capabilities.

## Reproduce the production check locally

Use Node 22.12+ and npm. On Windows PowerShell:

```powershell
npm.cmd ci
$env:VITE_BASE = '/tab-receipt-splitter/'
npm.cmd run verify
npx.cmd playwright install chromium webkit
$env:PLAYWRIGHT_BASE_URL = 'http://127.0.0.1:4173/tab-receipt-splitter/'
$env:RUN_OCR_TESTS = '1'
npm.cmd run test:e2e -- --workers=2
```

On macOS/Linux, use `npm`/`npx` and set environment variables with `export NAME=value`. Linux CI installs browser OS dependencies with `npx playwright install --with-deps chromium webkit`.

For a manual production preview after building:

```powershell
$env:VITE_BASE = '/tab-receipt-splitter/'
npm.cmd run preview -- --host 127.0.0.1 --port 4173
```

Open `http://127.0.0.1:4173/tab-receipt-splitter/`. Do not double-click `dist/index.html`; OCR workers and module scripts need HTTP or HTTPS.

See [the current verification record](docs/RELEASE-VERIFICATION.md) for the checks actually run and remaining limits.
