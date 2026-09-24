# Digital thermal receipt

The receipt is the protagonist. Every visual cue should come from paper, ink, scanning, allocation, or exact money—not generic SaaS decoration.

## Tokens

| Role | Token | Value |
| --- | --- | --- |
| Shell | `--shell` | `#0B0B0C` |
| Elevation | `--elevated` | `#151517` |
| Paper | `--paper` | `#F5F0E6` |
| Secondary paper | `--paper-secondary` | `#E8E1D5` |
| Ink | `--ink` | `#151515` |
| Muted ink | `--ink-muted` | `#68645D` |
| Primary | `--thermal` | `#FF5A1F` |
| Focus/highlight | `--thermal-bright` | `#FF7745` |
| Exact success | `--success` | `#B7F56A` |
| Warning | `--warning` | `#F3BD70` |
| Error | `--error` | `#FF9986` |

Participant identities use five deliberately muted tints with deterministic initials. They are not an extra rainbow palette. Selection also has a check mark and pressed state, never color alone.

## Type, spacing, geometry

Manrope Variable is the primary face; weights around 400, 650, 750, and 800. IBM Plex Mono 400/500 is reserved for OCR metadata, receipt names, and small labels. Inputs remain 16px to avoid accidental mobile input zoom. Use system fallbacks when a local font has not loaded.

Base spacing is 4px, with the preferred rhythm 8 / 12 / 16 / 24 / 32 / 48. A normal button is at least 52px high; icon targets are 44px; the bottom primary is 60px. Support 320px without horizontal document scroll. Scroll the participant rail, not the page width.

Corners: 8px small paper / 16px controls / 24px dialogs / fully rounded identity chips. The receipt’s lower tear is CSS, never a decorative photo. Paper grain is a tiny procedural SVG data asset. Shadows use restrained near-black layers, with sharper contact shadows on receipt sheets and softer lift on floating allocations.

Desktop is a centered workspace with a contextual step rail, not a stretched phone. The bottom action is portaled outside transformed screen wrappers, so it remains genuinely fixed. Safe-area insets are included in its padding.

## Motion contract

Presets live in `src/lib/motion.ts`.

| Preset | Purpose | Parameters |
| --- | --- | --- |
| `snappySpring` | Chip/tactile movement | stiffness 480, damping 34, mass .72 |
| `softSpring` | Paper and sheet movement | stiffness 180, damping 24, mass .85 |
| `itemReflow` | Edited/reordered items | stiffness 380, damping 32 |
| `moneySpring` | Amounts and focused response | stiffness 210, damping 32, mass .7 |
| `screenTransition` | Stage change | 320ms; ease [.22, 1, .36, 1] |
| `resultReveal` | Receipt line staging | 70ms stagger, 80ms start |
| `successPop` | Small success emphasis | short spring, no bouncing celebration loop |

Money ticks are display-only. Business arithmetic is already exact before the animation starts. Tickers settle to the exact value on a bounded deadline: 280ms for edits or 520ms after their result-reveal delay. Completion is scheduled at about 1,320ms and only when the arithmetic reconciles.

Use one dominant effect per stage. Home: emerging paper. Processing: scan beam. Review: extracted cards. People: chip reflow. Assignment: pulse from person to amount. Extras: live total. Results: thermal reveal. Share: shared `layoutId` receipt morph.

Looping CSS and hero effects pause when the document is hidden. `prefers-reduced-motion` disables decorative loops, translations, allocation pulses, and confetti; exact amounts, labels, focus, and controls still work. Do not equate configured timings with verified 60fps: profile the real dependency build on devices before claiming performance.

## Component provenance

Radix-backed shadcn primitives own focus/dismissal/pressed behavior. Magic adaptations own tiny specific mechanisms, not the art direction. Upload/focus surfaces are original and only conceptually Aceternity-inspired. Never add a stock rainbow border, blue SaaS button, giant glass sheet, or competing background animation.
