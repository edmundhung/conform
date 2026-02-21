---
'@conform-to/valibot': patch
---

fix: correct return type of `coerceFormValue` to reflect actual result

`coerceFormValue` now returns `GenericSchema<InferInput<Schema>, InferOutput<Schema>>` (or `GenericSchemaAsync<...>` for async schemas) instead of `Schema`.

This fixes a type inaccuracy where the previous signature claimed to return the same schema type as the input, but actually returns a piped/wrapped schema that doesn't expose all original properties (like `.entries` on object schemas).

There are **no runtime changes**. The function behavior is identical. Only the TypeScript types are corrected to match the actual return value.

```ts
const schema = v.object({ name: v.string() });
const coercedSchema = coerceFormValue(schema);

// Before: TypeScript incorrectly allowed this
// coercedSchema.entries // Would compile but fail at runtime

// After: TypeScript correctly reports an error
// coercedSchema still supports .parse() and .safeParse()
const result = coercedSchema.parse({ name: 'test' }); // ✅ Works as expected
```
