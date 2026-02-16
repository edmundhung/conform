---
'@conform-to/zod': minor
'@conform-to/react': minor
'@conform-to/dom': minor
---

feat: support recursive schemas in `getZodConstraint`

`getZodConstraint` now correctly returns constraints for fields inside recursive schemas (both getter-based and `z.lazy()`). Previously, constraints for nested levels beyond the first were not resolved.
