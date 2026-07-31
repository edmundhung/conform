---
'@conform-to/react': patch
---

Fix `DefaultValue` to preserve string literal types so `z.literal(...)` schemas infer their literal value instead of widening to `string`.
