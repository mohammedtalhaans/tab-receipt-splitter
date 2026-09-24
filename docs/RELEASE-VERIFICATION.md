# Release verification — 12 September 2026

## Latest UX refinement

The deeper UX pass is now included in source and the portable production build. **99/99 unit tests**, dependency-backed TypeScript, the privacy guard across **53 modules**, license packaging, and the production asset checks passed again. Initial JavaScript is **176.3 KiB gzip**. The earlier figures further down this document describe the first release pass.

On the final production build, **all 41 Chromium browser cases passed**, including actual OCR. **15 WebKit cases passed** before its OCR case stalled again in the Windows test runtime. The remaining combined run was stopped to respect the requested wrap-up; an 82/82 final pass is not claimed. The new review, assignment, results and navigation cases had separately passed both browsers during this refinement. Current WebKit focus regressions passed after the final focus fix. The existing Windows WebKit OCR intermittency remains a test limitation requiring a real-device Safari check.

The final production screenshot sweep passed **48/48 layouts**, with **zero axe violations on eight screens** and **zero console/page errors**. Current screenshots and the 1080 × 1390 demo export are refreshed in `episode/screenshots/`.

The new tests cover repeated manual entry, draft preservation, browser Back/Forward, dialog focus, removal Undo, searchable assignment, 20-person pickers, readable exports and sharing failures. See [UX-POLISH.md](UX-POLISH.md) for the delivered changes.

This is the current release record. The earlier offline delivery record remains in [QA.md](QA.md) for historical context.

The app was installed, built, and exercised with its real dependencies on Windows using Node 24.0.0. The final `dist` uses portable `./` URLs and was served at `http://127.0.0.1:4173/tab-receipt-splitter/` to test a GitHub Pages project path. No GitHub repository or hosted deployment was created.

## Verified

| Check | Actual result |
| --- | --- |
| Dependency installation and lockfile | Installed successfully; generated `package-lock.json` included |
| Dependency audit | **0 reported vulnerabilities**, including development dependencies; [audit JSON](qa/release-dependency-audit.json) |
| TypeScript | `tsc --noEmit` passed with installed dependency types |
| Vitest | **96/96 tests passed** across parser, exact-cent splitting, app state, and OCR cancellation; includes 5,500 seeded rounding/bill scenarios |
| Source privacy guard | Passed across **51 source modules** |
| Real production build | Passed for `/tab-receipt-splitter/` and final portable `./` paths |
| Production assets | Worker, eight core files, English OCR data, and bundled fonts present; local asset path checks passed |
| Redistribution notices | Final build includes original/adapted-code notices, font licenses, and notices for **79 production packages** under `licenses/`; the production guard verifies their presence |
| Initial JavaScript | **168.2 KiB gzip** on the final portable build; below the 350 KiB project budget |
| Lazy OCR | OCR engine, WASM, worker, and language data are not requested on the landing screen |
| Actual browser OCR | Both Chromium and WebKit read the synthetic clean receipt with the actual local Tesseract WASM worker: 10 items and exact receipt matches; final smoke tests took **2.7s / 3.8s** respectively |

## Browser workflow coverage

The production Playwright suite runs with two workers, Chromium 140 and WebKit 26 browser engines, iPhone 13 emulation, and reduced motion. It checks:

- Demo review → people → individual/shared item assignment → 15% tip → exact results → PNG export → refresh clears the session.
- Exact tipped demo amounts: **$81.25 + $48.75 + $61.25 + $35.00 + $30.00 = $256.25**.
- Manual entry, explicit total confirmation, keyboard-added people, unsupported-file recovery, and clipboard-denial fallback.
- Workflow widths **320, 360, 375, 390, and 430px** with no horizontal overflow.
- Landing accessibility using axe WCAG A/AA rules, correct heading focus on navigation, and Back/Home cancellation during sample processing.
- Five-person PNG **1080 × 1390** and six-person PNG **1080 × 1502**, with additional space for the final person and footer.
- Same-origin GET/HEAD requests only in the demo and Chromium OCR runs, no page errors in the complete demo, no Web Storage writes, and no retained session after refresh.

**Final browser result: 30/30 passed in 1.3 minutes; no skipped tests.** Both engines ran the real OCR case against the portable production build at the project subpath.

After adding the redistribution notices, the production build and asset checks passed again. The final output also passed complete demo/export and actual OCR checks in both engines. WebKit OCR was rerun with one worker and passed in 4.3 seconds.

The separate production visual sweep passed **48/48 layout checks** across home, capture, review, people, assignment, extras, results, and share at the five mobile widths plus **1440px desktop**. All **eight stages had zero axe violations**, with **zero console or page errors**. Its actual URL, per-stage observations, and PNG dimensions are in [release-visual.json](qa/release-visual.json). A separate normal-motion demo also passed; home and results screenshots are included. Current screenshots are in [episode/screenshots](../episode/screenshots/).

## Release fixes

- Corrected the installed Manrope font import so the app builds with the declared packages.
- Fixed Playwright configuration and aligned the axe/Playwright dependency types; corrected an outdated tip selector to use the actual radio control.
- Kept the shared CommonJS runtime out of the OCR chunk so scanning stays lazy.
- Disabled automatic asset inlining so small bundled fonts are served as local files and respect the strict production content security policy.
- Updated affected development tools to Vite 6.4.3, Playwright 1.55.1, and Vitest 4.1.11; the resulting dependency audit is clear.
- Tightened receipt total parsing and scan cancellation, corrected stage focus, kept assignment totals visible while scrolling, and reserved share-card footer space for larger groups.
- Verified GitHub Action pins against the official GitHub API. Checkout v7, setup-node v7, upload-pages-artifact v5, and configure-pages v6 matched. Deploy-pages was updated to the current v5 commit. CI now uses the included lockfile with `npm ci`.

## Remaining checks

- No physical iPhone/Android camera, orientation, native share-sheet, or social in-app-browser result is claimed. Follow the short phone check in [GITHUB-PAGES.md](../GITHUB-PAGES.md).
- No hosted HTTPS deployment, production traffic, universal OCR accuracy, 60fps, or measured phone performance is claimed. The OCR fixture is synthetic and does not establish a real-world accuracy rate.

The build emits Vite's advisory warning for a main chunk above 400 kB before gzip; it is **168.2 KiB gzip**, and the explicit production budget check passes. This is a size advisory, not a failed build.

Concurrent Windows WebKit instances intermittently stalled during OCR in two runs. Isolated OCR checks and one complete combined suite passed. The WebKit test project now uses one worker to avoid that local test-runtime contention; the overall suite can still use two workers. Details from the initial isolated checks are retained in [webkit-ocr-diagnostic.json](qa/webkit-ocr-diagnostic.json).

## Reproduce

Follow [GITHUB-PAGES.md](../GITHUB-PAGES.md). CI rebuilds with the actual repository name, runs unit/privacy/asset checks and Chromium/WebKit workflows, then deploys only after verification succeeds.

Official action references checked on 12 September 2026: [checkout v7](https://api.github.com/repos/actions/checkout/git/ref/tags/v7), [setup-node v7](https://api.github.com/repos/actions/setup-node/git/ref/tags/v7), [upload-pages-artifact v5](https://api.github.com/repos/actions/upload-pages-artifact/git/ref/tags/v5), [configure-pages v6](https://api.github.com/repos/actions/configure-pages/git/ref/tags/v6), [deploy-pages v5](https://api.github.com/repos/actions/deploy-pages/git/ref/tags/v5).
