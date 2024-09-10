---
'@conform-to/zod': patch
---

fix(conform-zod): empty string default value support

Previously, we suggested using `.default()` to set a fallback value. However, `.default()` does not work as expected with `z.string().default('')`. This issue has now been resolved, but keep in mind that the default value is still subject to validation errors. For more predictable results, we recommend using `.transform(value => value ?? defaultValue)` instead.

Fix #676
