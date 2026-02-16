---
'@conform-to/valibot': minor
---

feat: support recursive schemas in `getValibotConstraint` and `coerceFormValue`

`getValibotConstraint` now correctly returns constraints for fields inside recursive schemas using `v.lazy()`. Constraint lookups for indexed paths (e.g., `items[0].name`) also resolve to their normalized form (`items[].name`). `coerceFormValue` now handles `v.lazy()` schemas, applying type coercion to fields inside recursive structures.
