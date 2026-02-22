---
'@conform-to/zod': minor
'@conform-to/valibot': minor
---

feat: add `coerceStructure` future APIs for zod and valibot

`coerceStructure(schema)` enhances a schema to convert form string values to their schema types (numbers, booleans, dates) without running validation rules. This lets you read current form values as typed data:

```ts
import { coerceStructure } from '@conform-to/zod/v4/future';
// For zod v3, import from '@conform-to/zod/v3/future';
// For valibot, import from '@conform-to/valibot/future';

const schema = z.object({
  age: z.number().min(0).max(120),
  subscribe: z.boolean(),
});

const value = coerceStructure(schema).parse({ age: 'abc', subscribe: '' });
//    ^? { age: NaN, subscribe: false }
```
