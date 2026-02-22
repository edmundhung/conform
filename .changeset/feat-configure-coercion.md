---
'@conform-to/zod': minor
'@conform-to/valibot': minor
---

feat: add `configureCoercion` for customizing form value coercion

`configureCoercion(config)` lets you customize how form values are coerced across both `coerceFormValue` and `coerceStructure`, e.g. trimming whitespace, stripping commas from numbers, or overriding coercion for a specific schema.

This replaces the `defaultCoercion` and `customize` options previously available on `coerceFormValue`.

```ts
import { configureCoercion } from '@conform-to/zod/v4/future';
// For Zod v3, import from '@conform-to/zod/v3/future'
// For Valibot, import from '@conform-to/valibot/future'

const { coerceFormValue, coerceStructure } = configureCoercion({
  // Trim whitespace and treat whitespace-only strings as empty
  stripEmptyString: (value) => {
    const trimmed = value.trim();
    return trimmed === '' ? undefined : trimmed;
  },
  // Custom number parsing: strip commas before converting
  type: {
    number: (text) => Number(text.trim().replace(/,/g, '')),
  },
});
```
