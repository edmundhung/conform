---
'@conform-to/zod': minor
---

Update the future `getConstraints` API so required fields inside a union branch stay required.

This better supports conditional forms where each union branch renders its own fields. For example:

```ts
const schema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('person'), name: z.string() }),
  z.object({ type: z.literal('company'), company: z.string() }),
]);

getConstraints(schema);
// Before: name and company were marked as { required: false }
// After: both are now marked as { required: true }
```
