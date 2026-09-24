# Captured app screens

These are real browser screenshots of the working app, using fictional sample data. The main numbered captures come from the production build served at a GitHub Pages-style subdirectory. They use reduced motion so every frame is settled.

- `01`–`08`: home, capture, receipt review, people, assignment, extras, results, share.
- `-390`: phone-sized viewport. `-1440`: desktop viewport.
- `05-assign-sticky.png`: the running totals stay visible near the end of the receipt.
- `share-card.png`: the actual downloaded-style PNG, **1080 × 1390**, **AUD $225.50**, no added tip. Use this for the main episode's result.
- `01-home-motion.png` and `07-results-motion.png`: additional captures from an animation-enabled local browser run. **The motion result uses the optional 15% tip: $256.25.** Do not put that frame under the main script's $225.50 narration.

All receipts and names are synthetic. Keep **SAMPLE RECEIPT** visible when cropping these into the episode. These images are not camera footage or evidence of a live public deployment. For animated footage, record the app using the episode kit's exact demonstration recipe.

Reproduce the production captures after starting preview:

```powershell
$env:CAPTURE_URL = 'http://127.0.0.1:4173/tab-receipt-splitter/'
node scripts/capture-release.mjs
```

The capture script also checks six viewport widths, eight screens with axe, the exact demonstration totals, the sticky totals bar, and runtime/console errors. Evidence is written to `docs/qa/release-visual.json`.
