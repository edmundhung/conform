---
'@conform-to/zod': patch
---

fix(zod): avoid bundling the Zod runtime when importing only `getConstraints` from `@conform-to/zod/v3/future` or `@conform-to/zod/v4/future`

Re-export the existing constraint helpers directly so bundlers can omit unused coercion setup. The public import paths and constraint behavior are unchanged.
