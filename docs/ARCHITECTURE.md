# Architecture and invariants

## State machine

`AppStage` is `home | capture | processing | review | people | assign | extras | results`. A reducer owns receipt, people, assignments, fee policy, and tip settings. Context derives reconciliation, running totals, assignment count, and validated results. Screen-local React state is limited to editor visibility, controlled form drafts, and ephemeral animation state.

Navigation guards require items and an exact confirmed reference before People, at least one participant before Assign, complete assignments before Extras, and a valid reconciled split before Results. Going back does not destroy assignments. Removing a participant removes their ID from every assignment. Deleting an item removes its assignment. Starting a new scan resets the bill deliberately; starting a fresh split clears the scanner and session.

The browser URL does not encode receipt data or route state. Reload returns to a clean home screen, including on a GitHub project page.

## Local image lifetime

1. File input/drop receives a browser `File`; an in-memory object URL presents the selected image immediately.
2. Validate file type and byte size. Inspect JPEG/PNG dimensions where possible.
3. A module worker uses `createImageBitmap` with orientation, an OffscreenCanvas, downscaling, and histogram-based luminance normalization. The fallback Canvas path is used when the worker capability is missing or unusable.
4. Release the original URL; display the prepared PNG URL. The prepared image feeds the lazy Tesseract worker.
5. Terminate the worker after recognition. Keep the reduced image for the user’s comparison, then revoke its URL on replacement/reset/unmount.

A monotonically increasing job ID prevents stale async completions from overwriting a new scan. An AbortController plus the 120-second limit controls cancellation. No original image is persisted. JavaScript reference cleanup is not a forensic memory-erasure guarantee; browsers control their own allocations.

## OCR and parsing are separate

The scanner displays actual Tesseract progress for recognition and indeterminate loading for asset initialization. It never invents incremental word detection. Only returned OCR line boxes are rendered. Fast demo playback is marked as sample data and does not impersonate live recognition.

The parser is deterministic and independent of UI/worker code. It normalizes practical OCR price noise, extracts the final price column, separates receipt summaries from ordinary items, and preserves duplicates with a check flag. Quantities are metadata; the parsed line price is already the extended line total. The parser does not multiply it again.

Confidence is an editing affordance, not a guarantee. A high-confidence OCR value can still be wrong. Mathematical reconciliation therefore remains a separate gate. A missing total is missing—not silently inferred and called detected. A user may explicitly confirm the reviewed item/extra sum as the reference, while the original detected total is retained for context.

Included tax is recognized from wording, or inferred only when that exact inclusion explains the receipt equation. Implicit inference creates a reading note. There is no automatic unexplained balancing item.

## Money contract

Domain amounts are bounded safe integer minor units. Floats exist only at formatting or animation boundaries. Percentages are basis points, and allocation products use BigInt.

For an amount `A` and nonnegative weights `w[i]`, allocate floors of `abs(A) × w[i] / sum(w)`. Rank the exact remainders descending and break ties by stable index. Distribute remaining cents one by one, then reapply A’s sign. Zero weights fall back to equal weights. Fractional cents, invalid weights, unknown/duplicate participant IDs, and unassigned items are rejected.

Item-level assignment uses equal weights among that item’s claimants in table order. Extras use each person’s assigned subtotal, or equal table weights when explicitly selected. Included extras are displayed but not added. Each fee has its own exact-cent allocation. The added tip is separate from printed gratuity. Negative final balances are treated as an invalid split, not hidden.

Before presenting results:

```text
sum(item line totals) + sum(non-included printed extras) == confirmed receipt total
sum(person totals) == confirmed receipt total + added tip
difference == 0
```

These equalities are prerequisites, not presentation-time rounding tricks.

## Sharing and permissions

A lazy Canvas module renders a summary image entirely locally. It waits for available bundled fonts, fits the total, truncates long names deliberately, and grows its portrait height for larger tables. It uses a Blob URL, not a hosted image URL. The default card omits item details.

The Blob/File is prepared before the user’s native-share click so the click’s transient activation is preserved. `navigator.share` and `navigator.canShare` are feature-detected. Unsupported/denied sharing leaves Save Image and Copy Summary available. Clipboard denial reveals selectable text. Cancelling a native share is not treated as a failed bill.

No app-owned network write occurs. A share target chosen by the user is outside the app’s privacy boundary.

## Static origin and dependencies

Vite’s relative default base and `assetUrl()` support nested static paths. The Actions workflow sets the precise Pages base. Build-time asset sync copies all local Tesseract assets and their licenses; OCR explicitly sets workerPath/corePath/langPath and disables the Tesseract persistent cache. Missing files stop the build instead of triggering an external fallback.

The production CSP restricts connections to self/blob, blocks objects and form submissions, permits local WASM compilation and workers, and permits only local/data/blob images. No hosted font request is needed. Development-only CSP relaxation exists for React Fast Refresh and never removes the production policy from the checked-in build source.

No service worker is installed. That avoids stale worker/model combinations and accidental sensitive offline persistence. HTTP caching of public code/model/font assets remains browser-controlled.

## Limits and validation boundaries

Initial scope: English OCR; six explicitly selectable two-decimal currencies; one receipt image; up to 20 participants. No hand-written OCR promise, payment processing, multi-receipt merge, debt tracking, exchange-rate conversion, or on-device persistence. Browser-supported HEIC/AVIF decoding is progressive enhancement, not guaranteed support on every device.

The committed tests cover deterministic logic and provide real-browser tests. The initial delivery’s environment did not run the real dependency bundle. The detailed distinction between source UI testing, native OCR experiments, and outstanding production/device validation is maintained in [QA.md](QA.md).
