---
name: thermal-design
description: Design and audit TAB's receipt-native interfaces and motion.
---
# Thermal design
Use for every UI change in this repository. Start with `docs/DESIGN_SYSTEM.md`.
Keep graphite, thermal paper, ink, orange, and occasional lime as the visual system.
One dominant interaction per screen. Money, names, and the next action must remain obvious.
Use shared physical relationships: image → receipt → extracted items → allocations → share card.
Use the reusable motion presets, at least 44px targets, safe areas, and 320px layout checks.
Respect reduced motion, keyboard focus, and page visibility. Never animate a value used for arithmetic.
Review screenshots with animations both enabled and disabled. No stock SaaS styling.
