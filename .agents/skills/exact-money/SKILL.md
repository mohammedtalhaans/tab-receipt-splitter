---
name: exact-money
description: Protect integer-minor-unit accounting and exact reconciliation.
---
# Exact money
Use for every parser, price, fee, tip, assignment, and result change.
Use safe integer minor units only. Use BigInt for allocation products and quotient/remainder arithmetic.
Share each item by largest remainder, then allocate each extra by item-subtotal weights.
Tie breaks follow participant creation order. Never silently lose or invent cents.
Reject unknown people, missing assignments, negative final balances, and unmatched receipt totals.
Keep inclusive taxes informational. Never add them twice.
Run invariant, fixture, and regression tests before changing calculation behavior.
