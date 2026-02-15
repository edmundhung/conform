---
'@conform-to/valibot': minor
---

feat: handle index normalization with `getValibotConstraint`

Constraint lookups for indexed paths (e.g., `items[0].name`) now correctly resolve to their normalized form (`items[].name`), matching the behavior of the Zod adapter.
