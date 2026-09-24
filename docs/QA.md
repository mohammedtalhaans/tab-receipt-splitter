# Original delivery validation record

> **Current status:** this page preserves the earlier offline delivery evidence. The dependency-backed release checks were subsequently run on 12 September 2026; see [RELEASE-VERIFICATION.md](RELEASE-VERIFICATION.md). Unchecked gates below describe the original delivery, not the current release.

**Source delivery: 12 September 2026. Not a verified production release.**

The application and release pipeline are implemented. The accounting and parser assertions ran, and an offline browser harness exercised the actual application source. Package installation was blocked by the build environment's outbound-network restrictions. Consequently, no real dependency-backed typecheck, Vite build, browser Tesseract.js run, GitHub Pages deployment, or physical-device sign-off is claimed.

## What actually ran

| Check | Observed result | Scope |
| --- | --- | --- |
| Dependency-free domain suite | **92/92 named cases passed** | Same cases registered by the included Vitest suites; executed with Node's TypeScript stripping, not the Vitest runner |
| Seeded rounding invariants | **5,500 scenarios passed** | Shared-item allocations, signed extras, and complete multi-person bills; included within the 92 named cases |
| Source syntax | **0 transpilation syntax errors** | TypeScript transpilation, not full dependency-resolved typechecking |
| Static privacy guard | **51 source modules passed** | No app-owned remote request literals, network writes, Web Storage/IndexedDB persistence, analytics SDKs, or unsafe HTML injection; checks strict production CSP and local OCR paths |
| Offline demo workflow | **Passed** | Capture demo → review → people → individual/shared assignments → 15% tip → results → share PNG → text fallback → fresh split |
| Exact demo result | **$81.25 + $48.75 + $61.25 + $35.00 + $30.00 = $256.25** | 10 items, 5 participants, service charge, included GST, added tip |
| Local PNG | **1080 × 1350 pixels** | Real browser Canvas export and Blob URL, using a fallback local font in the QA runtime |
| Offline demo network | **58 GET requests; 0 POST requests** | Local QA resource loads only; not proof of browser OCR network behavior |
| Offline demo runtime | **0 page errors; 0 console errors** | Dependency stand-ins mean real Motion/Radix behavior remains unverified |
| Responsive layout | **42/42 stage-width checks passed** | Home, review, people, assign, extras, results, share at 320, 360, 375, 390, 430, and 1440px; no document horizontal overflow |
| Manual-entry fallback | **Passed at 320px** | Unsupported PDF escape, explicit missing-total confirmation, Enter to add a person, duplicate-name rejection, unassigned-item guard |
| Manual odd-cent split | **$2.26 + $2.25 = $4.51** | Shared-item range correctly reads $2.25–$2.26 each; clipboard fallback exposes selectable text |
| Native OCR experiment | **7/9 exact; 2 safely unconfirmed** | Native Tesseract CLI, not browser Tesseract.js; details below |

Evidence: [core output](core-test-results.txt), [offline flow](qa/offline-flow.json), [responsive observations](qa/offline-responsive.json), [manual-flow observations](qa/offline-manual.json), [native OCR results](native-ocr-results.json).

## Offline UI harness: important limitations

The temporary harness transpiled the actual source and ran it with a real React runtime in Chromium. Because npm dependencies could not be installed, small QA-only stand-ins represented Motion, Radix, Lucide, class utilities, and related package interfaces. Browser navigation was restricted by the environment, so the test mounted HTML with locally fulfilled resources instead of serving a real Vite bundle.

This is useful evidence for state transitions, rendered DOM, button actions, exact arithmetic, Canvas image generation, error escape, and CSS overflow. **It is not evidence that package APIs, focus trapping, actual icons, animation physics, shared-layout transitions, CSS compilation, CSP in a real build, or native share work in production.** The harness and replacement libraries are not included in the product source.

Screenshots in `docs/screenshots/` are from this offline source UI. A locally available Inter fallback stood in for the intended npm-bundled Manrope/IBM Plex fonts; animation and component stand-ins affect presentation. `share-card.png` is a genuine locally generated PNG. These images document design and layout, not a deployed app or measured production rendering performance.

A horizontal-scroll bug in the running-total rail was found during the 320px checks and fixed before the final matrix. Review quantity metadata contrast was adjusted during a manual/DOM-based contrast check. That check is not a substitute for a full WCAG or assistive-technology audit.

## Native OCR experiment

Nine entirely synthetic receipt images were generated with `scripts/generate-fixtures.py`. Native **Tesseract 5.5.0 CLI**, English, page-segmentation mode 6, read each generated PNG directly. Its text was passed through the same deterministic TypeScript parser and reconciliation logic. The application's preprocessing worker was **not** part of this experiment.

| Fixture | Parsed outcome |
| --- | --- |
| Clean | 10 items; $225.50; exact match |
| Angled | 10 items; $225.50; exact match |
| Dim | 10 items; total unreadable; correctly requires confirmation |
| Crumpled simulation | 10 items; item sum $0.08 too high; correctly blocks confirmation |
| Small font | 10 items; $225.50; exact match |
| Service charge | 10 items; $225.50; exact match |
| Discount | 3 items; $28.00; exact match |
| Quantity lines | 3 items; $36.00; exact match |
| Long receipt | 24 items; $79.20; exact match |

The dim and crumpled OCR outputs are retained under `tests/fixtures/observations/` as regression cases. No failed OCR amount was silently rounded or balanced into a success. The set is deliberately small and synthetic; **7/9 is not a real-world accuracy estimate**. Real handwritten, multi-column, glossy, folded, or heavily skewed restaurant receipts remain outside this evidence.

## Release gates that have not run

- [ ] Online `npm install`; inspect dependency notices; commit the generated `package-lock.json`.
- [ ] Actual `npm run typecheck`, `npm test` (Vitest), and `npm run build`.
- [ ] `npm run check:dist` against real output, including subdirectory paths and the initial gzip budget.
- [ ] Full Playwright tests against the real production build, including axe rules and Chromium/WebKit.
- [ ] `RUN_OCR_TESTS=1` browser WASM OCR smoke test using real worker/core/English assets; inspect all requests.
- [ ] Physical iPhone Safari and Android Chrome camera/photo-picker, file decode/orientation, manual corrections, results, and share/save/copy.
- [ ] Instagram and TikTok in-app-browser checks, including the nonblocking external-browser advisory.
- [ ] Real Motion result/share choreography, reduced-motion setting, keyboard navigation, screen-reader experience, dialog focus, zoom, and touch targets.
- [ ] Phone memory/CPU measurements and 60fps/high-refresh animation profiling; compare 1800/2200/2500px OCR sizing using representative receipts.
- [ ] Successful authenticated GitHub Actions deployment and a live HTTPS project-page check.

Do not check these off based on the offline evidence above. Deployment CI includes the dependency-backed tests and will refuse to deploy after a failing test/build. Real-device checks are still a separate human release gate.

## Reproduce with online dependencies

```bash
npm install
npm run verify
npx playwright install --with-deps chromium webkit
RUN_OCR_TESTS=1 npm run test:e2e
```

For a project-page path rather than `/`:

```bash
VITE_BASE=/receipt-splitter/ npm run build
VITE_BASE=/receipt-splitter/ npm run check:dist
PLAYWRIGHT_BASE_URL=http://127.0.0.1:4173/receipt-splitter/ RUN_OCR_TESTS=1 npm run test:e2e
```

The build pre-step copies OCR assets from installed packages. There is no cloud fallback if those files are missing. The E2E OCR case intentionally uses real WASM and has a longer timeout; demo cases deliberately use the visibly labeled sample output.

## Practical physical-device script

Open the HTTPS project page in Safari or Chrome. Scan a non-sensitive receipt, cancel one scan, choose another, edit one amount, confirm the printed total, add at least two people, share an odd-cent item, edit an extra, add a tip, and expand the final details. Check that the names sum exactly to the final total. Generate a PNG, test native sharing and cancellation, deny clipboard permission, and use the fallback. Refresh and confirm the session is gone. Repeat with reduced motion, a 320px-equivalent viewport/zoom, and a keyboard/screen reader where supported.

Inspect requests while scanning: only static same-origin reads should occur. No receipt text, prices, names, photo bytes, or analytics events should leave the app. Sharing to a user-chosen native destination is a separate, explicit action.
