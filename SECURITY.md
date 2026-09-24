# Security and privacy

## Boundaries

This app owns no server endpoint. Photos, extracted text, people, and assignments are processed in browser memory. Static assets are fetched from the deployment origin. Explicit share/save actions may hand a generated summary to the browser, operating system, filesystem, or selected share destination. The destination is outside this app's privacy boundary.

The app makes no promise against a compromised browser, operating system, extension, maliciously modified deployment, device screenshots, or forensic memory recovery. Do not use it for receipts you cannot safely process on the current device. Verify the deployed source and maintain dependencies.

## Reporting

Once this source is hosted in a repository, use that repository's **Security → Report a vulnerability** private advisory mechanism when enabled. No maintainer email or identity has been invented in this source delivery. If private reporting is unavailable, open a minimal issue requesting a private reporting channel; do not publish exploit details, private receipt data, or credentials.

Include the source revision, browser/version, affected feature, and a non-sensitive reproduction. Prioritize unexpected outbound requests, persistent receipt storage, DOM injection, unsafe file handling, worker leaks, or incorrect final reconciliation.

## Maintenance and release checks

There is not yet a supported published release. Before one is tagged, finish `docs/QA.md`, commit the real package lock, review advisories and package licenses, run the production request audit, and verify same-origin OCR assets. The source audit is a useful guard, not a comprehensive security audit.

Keep the strict production Content Security Policy. The development-only relaxation supports Vite's refresh preamble; it is not shipped in production. Never expose the development server to the public internet. No application secret belongs in a `VITE_` environment variable, because Vite exposes those values in client code.
