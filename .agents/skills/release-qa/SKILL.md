---
name: release-qa
description: Gate releases on functional, privacy, accessibility, and deployment checks.
---
# Release QA
Use before release and after core-flow changes. Read `docs/QA.md`.
Test real capture, sample playback, manual entry, corrections, people, assignment, extras, and sharing.
Check 320, 360, 375, 390, and 430px widths and a deliberate desktop layout.
Inspect network methods, persistent storage, blob cleanup, reduced motion, and keyboard behavior.
Test the production build at a non-root path. Never substitute dev-server success for Pages verification.
Record precisely which checks ran. A missing dependency or device is not a passing test.
Do not claim hosted deployment, 60fps, or physical-device support without evidence.
