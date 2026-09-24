# Experience refinement

This pass preserves tab's thermal-receipt identity while making the whole meal-splitting workflow easier to read, operate and recover from.

Design direction: graphite `#0B0B0C`, raised charcoal `#1D1D20`, thermal paper `#F5F0E6`, ink `#151515`, orange `#FF5A1F`, and exact-total lime `#B7F56A`. Manrope carries the interface; IBM Plex Mono identifies actual receipt data. The physical receipt-to-individual-shares transformation remains the signature.

Priorities:

1. Put the scan/demo actions ahead of the decorative receipt on phones; offer manual entry directly.
2. Raise functional text size and touch-target size. Keep tiny type only inside the decorative receipt illustration.
3. Make the current stage clear and earlier stages easy to revisit without discarding work.
4. Make manual entry, receipt comparison and corrections fast; keep total validation explicit.
5. Keep large receipts and large tables manageable without losing multi-person sharing choices.
6. Make the final bill and each person's charges understandable, with resilient image/text sharing.
7. Verify narrow and short viewports, large text, keyboard operation, errors and real OCR on the static project-path build.

The design avoids an unrelated visual redesign: more decoration would compete with the names, money and next action. Improvements should reduce effort or clarify the result.

## Delivered

- Scan/demo and direct manual entry appear before the illustration on phones.
- Functional text, form hints, touch targets and sheet content are larger and clearer.
- Browser Back/Forward retain the current split; Back dismisses sheets and protects unsaved edits. Dialogs return focus to their actual opener, including WebKit. A progress menu and desktop step links support direct navigation.
- Returning home offers the current in-memory receipt; deliberately starting fresh clears it and resets navigation. No receipt data is written into URLs or browser history.
- Repeated manual entry, focused error correction, amount-limit checks, prominent printed totals, zoomable photo comparison, and review-needed filtering reduce correction work.
- Item search, a stable claim queue, keyboard-friendly Find next, a searchable picker for large tables, and participant-removal Undo make assignment manageable.
- Results expose named charges and each person's subtotal/extras/total. Sharing handles image failure, retry, denied clipboard, native share cancellation and download fallbacks.
- Large names wrap in the exported card. Large-table previews scroll at a readable width.
- Tailwind scans app source only, so temporary test artifacts and documentation cannot alter the stylesheet. This follows [Tailwind's explicit source guidance](https://tailwindcss.com/docs/detecting-classes-in-source-files).

The complete current test record is in [RELEASE-VERIFICATION.md](RELEASE-VERIFICATION.md). Physical camera and native OS share-sheet checks remain separate from automated browser verification.
