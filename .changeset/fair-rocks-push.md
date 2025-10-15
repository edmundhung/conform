---
'@conform-to/valibot': patch
---

Fix `coerceFormValue` to preserve the exact schema type instead of widening to `GenericSchema | GenericSchemaAsync` to restore compatibility with standard schema types.
