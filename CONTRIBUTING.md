# Contributing to tab

Keep the product focused on one restaurant moment: who owes what, right now. Preserve the local-only privacy boundary and the thermal-receipt design system.

## Set up

Use Node 22.12 or newer. Run `npm install` for the first install, commit the generated lockfile, and use `npm ci` afterwards. `npm run dev` prepares same-origin OCR assets and starts Vite. No account, paid API, database, or backend is required. Optional `.env.local` links are documented in the README.

## Before opening a pull request

Run `npm run verify`. Install Chromium and WebKit with `npx playwright install --with-deps chromium webkit`, then run `RUN_OCR_TESTS=1 npm run test:e2e`. Include the actual command results and anything you could not test. Do not describe a synthetic or mocked scan as production OCR evidence.

Parser and accounting changes need regression cases in `tests/cases.ts`. That file feeds both the Vitest suites and the dependency-free core runner. Keep all domain money in safe integer minor units. Never fix reconciliation by inserting an unexplained balancing charge, discarding duplicate-looking items, or assuming an unreadable total.

For interface work, include 320px and desktop screenshots, keyboard and reduced-motion observations, and any focus or touch-target changes. Reuse `src/lib/motion.ts` presets and the tokens in `docs/DESIGN_SYSTEM.md`; avoid adding a second animation engine.

## Safe bug reports

Describe the steps, browser/version, receipt format, expected total, and observed result. Use a synthetic receipt or redact personal data before creating a public issue. Do not attach names, card details, addresses, private receipt photos, or original OCR dumps. Security/privacy defects should follow `SECURITY.md` rather than a public repro with sensitive data.

## Scope and licensing

No analytics, cloud OCR, persistence, payment integration, or external processing may be added without an explicit product decision. Native sharing must remain user initiated. Do not commit generated `public/ocr/`, `dist/`, credentials, personal receipts, or font binaries.

Use only dependencies and copied components whose licenses allow redistribution in this source repository. Preserve upstream notices and document modifications. The `aceternity-inspired` directory contains original code, not Aceternity source. Read `THIRD_PARTY_NOTICES.md` before replacing it.

The four original project skills in `.agents/skills/` document engineering guardrails for agent-assisted changes. They are not substitutes for tests or a release review.
