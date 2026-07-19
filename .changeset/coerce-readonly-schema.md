---
'@conform-to/zod': patch
---

Support `z.readonly()` schemas in `coerceFormValue` and `getZodConstraint`.

Previously, the `readonly` wrapper was treated as an opaque type, so coercion was skipped for any field defined with `.readonly()` (e.g. `z.number().readonly()` would fail with `expected number, received string`) and `getZodConstraint` dropped the field's validation attributes (such as `minLength`). The wrapper is now unwrapped like other transparent wrappers (`.nullable()`, `.brand()`), so its inner type is coerced and its constraints are derived correctly. This applies to the default, `/v3`, and `/v4` adapters.
