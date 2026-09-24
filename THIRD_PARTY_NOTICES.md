# Third-party notices

Original tab source is MIT licensed; third-party code and assets retain their own notices. This document does not replace the license files in installed dependencies. No paid template or pro component is included.

## Adapted shadcn/ui primitives

Source family: [shadcn-ui/ui](https://github.com/shadcn-ui/ui). Upstream [license](https://github.com/shadcn-ui/ui/blob/main/LICENSE.md).

Affected directory: `src/components/ui/`. Button, input, dialog/sheet, alert dialog, progress, tooltip, separator, skeleton, and toggle-group patterns have been adapted. Changes include original thermal styling, minimum touch sizes, custom motion integration, accessible labels, and product-specific variants. Radix package implementations are npm dependencies, not vendored copies.

```text
MIT License

Copyright (c) 2023 shadcn

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Adapted Magic UI components

Source family: [magicuidesign/magicui](https://github.com/magicuidesign/magicui). Upstream [license](https://github.com/magicuidesign/magicui/blob/main/LICENSE.md).

Affected files: `src/components/magic/number-ticker.tsx`, `border-beam.tsx`, `blur-fade.tsx`, and `confetti.tsx`. The adaptation uses integer-cent presentation, fixed exact-value settlement, original scan-boundary geometry and palette, faster selective entry, restrained completion, visibility checks, and reduced-motion support. Confetti relies on the separately installed canvas-confetti package.

```text
MIT License

Copyright (c) Magic UI

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Original Aceternity-inspired interactions

`src/components/aceternity-inspired/` contains **original code** for the receipt upload interaction and focused perimeter response. It does not contain downloaded, purchased, or copied Aceternity source. The naming acknowledges the design reference, not a dependency or endorsement.

The official [license page](https://ui.aceternity.com/licence) and [terms](https://ui.aceternity.com/terms) were consulted. They describe restrictions and use Pro terminology without resolving the redistribution status needed for this particular source delivery. Rather than assert a blanket license for free components, this project uses its own implementations. Reassess the exact component-specific license before substituting upstream source.

## Runtime dependencies and generated assets

React, Motion, Radix primitives, Tailwind CSS, Vite, the class utilities, and test/build tools remain external npm dependencies. Retain their installed license notices when distributing relevant code. Lucide's icon license and any included icon-specific notices must also be retained; do not treat every asset as original tab artwork.

Tesseract.js, its compiled core, and English trained data are installed from their named packages. `scripts/sync-ocr-assets.mjs` copies the worker/WASM/language files into `public/ocr/` and copies available package-root LICENSE, NOTICE, and COPYING files beside them. Upstream references: [Tesseract.js](https://github.com/naptha/tesseract.js), [Tesseract.js core](https://github.com/naptha/tesseract.js-core), [language data](https://github.com/naptha/tessdata).

The release includes a generated dependency lockfile and has been built with installed packages. `scripts/sync-license-notices.mjs` reads its production-package entries, excludes development-only packages, and copies installed LICENSE, LICENCE, NOTICE, COPYING, and OFL files into `public/licenses/`, including nested notices and font licenses. Packages that omit physical notices use the checked source notices documented in `docs/licenses/SOURCE-NOTICES.md`; Radix internals use the installed notice from the same upstream repository. The English package's npm MIT declaration is recorded separately from the preserved Apache-2.0 trained-data notice. The output also includes this document and the original project license. `public/licenses/index.json` records package versions, declared licenses, notice sources, and paths. Vite carries this directory into `dist/licenses/` for static deployment. Keep the entire `licenses/` directory, the OCR notices, and this document with redistributed builds. The script fails if a production package has neither an installed notice nor a documented fallback; this preservation step is not a substitute for reading applicable terms.

## Fonts and artwork

The application imports Manrope and IBM Plex Mono through the named Fontsource npm packages. Their licenses are preserved under `public/licenses/@fontsource-variable/manrope/` and `public/licenses/@fontsource/ibm-plex-mono/`, then included in `dist/licenses/` with the bundled font assets. Retain these notices when redistributing the build.

The logo, procedural textures, torn-paper geometry, receipt illustrations, synthetic fixture text/images, and Canvas share-card design were created for this project. Fixtures contain fictional restaurant and participant data. Current README captures are in `episode/screenshots/` and show the dependency-backed production UI. Earlier offline checks remain historical evidence in `docs/QA.md`; see `docs/RELEASE-VERIFICATION.md` for current release results. No real personal receipt is included.
