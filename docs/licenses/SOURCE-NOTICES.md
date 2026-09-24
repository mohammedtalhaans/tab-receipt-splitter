# Notices omitted from npm archives

These upstream license files were retrieved on 12 September 2026 and retained unchanged. Build-time copying uses these local files; it does not fetch them during deployment or at runtime.

- `tessdata-LICENSE`: https://raw.githubusercontent.com/naptha/tessdata/gh-pages/LICENSE — Apache-2.0 notice for the language data repository. The English npm package declares MIT in package metadata, but omits a physical license. The actual trained data repository's Apache notice is preserved as well; do not infer the data's license solely from npm metadata. Package/data relationship: https://github.com/naptha/tessdata#npm-packages.
- `react-remove-scroll-bar-LICENSE`: https://raw.githubusercontent.com/theKashey/react-remove-scroll-bar/master/LICENSE — MIT, copyright Anton Korzunov. The installed 2.3.8 archive declares MIT but omits its physical license. This is the current upstream notice, not a claim of an exact version-tag retrieval.
- `tr46-LICENSE.md`: https://raw.githubusercontent.com/Sebmaster/tr46.js/master/LICENSE.md — MIT, copyright Sebastian Mayr. The installed 0.0.3 archive declares MIT but omits its physical license. This is the upstream repository named in that package's metadata.

Several installed `@radix-ui/*` internal packages omit license files. They use the MIT notice installed with `@radix-ui/react-dialog`, from the same `radix-ui/primitives` repository. The generated manifest explicitly records that notice source.

The manifest records a package's declared license separately from the actual preserved notice files. Keep all preserved files with redistributed static assets.
