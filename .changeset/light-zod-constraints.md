---
'@conform-to/zod': patch
---

fix(zod): avoid bundling the Zod runtime when importing only `getConstraints` from `@conform-to/zod/v4/future`

Re-export the existing constraint helper directly so bundlers can omit unused coercion setup. The public import path and constraint behavior are unchanged.
