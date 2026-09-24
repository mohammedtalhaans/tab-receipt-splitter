# People and assignment refinement

Checked against the local Vite development app on 12 September 2026. These checks support the interaction changes; the final production build, subpath checks, and full release record belong to `docs/RELEASE-VERIFICATION.md`.

## Changes

- Item search and a claim queue for long receipts. A dish remains in the queue while additional sharers are chosen; only an explicit refresh or Find next refreshes the queue.
- Find next clears restrictive searches, advances through unassigned dishes, and moves keyboard focus below the sticky totals.
- Tables with more than seven people use a searchable multi-select sheet instead of repeating every person on every item. Selection survives searching, and the Done button stays visible while the names scroll.
- Removing a person provides an inline Undo. Restoration preserves their position in the table, existing item selections, and exact-cent tie-break order. Renaming preserves assignments.
- Clear item selections, distinct line-total quantity wording, larger assignment labels, and 44px-or-larger interaction targets.

## Evidence

- All six scenarios in `tests/e2e/assignment-polish.spec.ts` passed in Chromium and WebKit against development source before the final sheet-height correction (12 browser cases).
- The additional 320 × 720 Done-button visibility assertion passed in both Chromium and WebKit after that correction. A WebKit attempt was initially blocked before reaching the app by a Vite CSS transform error caused by disappearing Playwright artifact SVGs. After the development server was repaired, the isolated WebKit rerun passed in 8.8 seconds.
- Three `tests/state/restore-person.test.ts` cases passed: original odd-cent recipient, existing-item-only restoration, and duplicate/full-table guards.
- Automated axe checks on the assignment screen and large-group picker found zero violations of the configured WCAG 2 A/AA and 2.1 AA rules. Raw result: `accessibility.json`.
- Visual captures include 390px people/assignment screens, 20 long names at 320px, and the 320px multi-select sheet. The targeted browser tests check that those layouts do not horizontally overflow.

Receipt parsing, OCR, storage, network behavior, and splitting arithmetic were not changed by these interface refinements. No physical-phone or universal accessibility guarantee is implied by these browser checks.
