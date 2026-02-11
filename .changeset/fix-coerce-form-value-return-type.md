---
'@conform-to/zod': patch
---

fix: return truthful type from `coerceFormValue`

The return type of `coerceFormValue` no longer pretends to be the original schema type. This means TypeScript will now correctly prevent you from accessing properties like `.shape` that don't exist on the coerced schema, instead of failing silently at runtime.
