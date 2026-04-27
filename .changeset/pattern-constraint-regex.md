---
'@conform-to/dom': patch
'@conform-to/react': patch
'@conform-to/valibot': patch
'@conform-to/zod': patch
---

`getZodConstraint`, `getValibotConstraint`, and the future `getConstraints` helpers can now derive HTML `pattern` constraints from Zod and Valibot schemas. When a field uses multiple regex validators, Conform combines them into a single `pattern` when possible.

Pattern generation is best-effort. Case-insensitive regexes and regexes that serialize to an invalid HTML `pattern` are skipped, and backreferences may behave differently when multiple regex validators are combined.

```tsx
import { getZodConstraint } from '@conform-to/zod/v4';
import { z } from 'zod';

const schema = z.object({
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/) // uppercase
    .regex(/[0-9]/) // digit
    .regex(/[!@#$%^&*]/), // special
});

const constraint = getZodConstraint(schema);
console.log(constraint.password.pattern);
// ^? '^(?=.*(?:[A-Z]))(?=.*(?:[0-9]))(?=.*(?:[!@#$%^&*])).*$'
```
