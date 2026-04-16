---
'@conform-to/dom': minor
'@conform-to/react': minor
'@conform-to/valibot': minor
'@conform-to/zod': minor
---

# Enable browser-native regex validation

Constructing `pattern` constraints from regex-refined string schemas allows for pattern-based validation without requiring client-side JavaScript.

This allows your schemas to directly influence `:valid` and `:invalid` pseudo-classes.

```tsx
import { configureForms } from '@conform-to/react/future';
import { getConstraints } from '@conform-to/zod/v4/future';
import { z } from 'zod';

const schema = z.object({
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/) // uppercase
    .regex(/[0-9]/) // digit
    .regex(/[!@#$%^&*]/), // special
});

const configuredForms = configureForms({
  extendFieldMetadata(metadata) {
    return {
      get inputProps() {
        return {
          // all of uppercase, digit, and special must match
          // '^(?=.*(?:[A-Z]))(?=.*(?:[0-9]))(?=.*(?:[!@#$%^&*])).*$'
          pattern: metadata.pattern,
          // ...
        };
      },
    };
  },
  getConstraints,
});
```
