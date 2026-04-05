---
'@conform-to/dom': minor
'@conform-to/react': minor
---

feat: customize serializer based on field name

The `serialize` options now let you customize serialization based on `ctx.name`, both globally through `configureForms()` and per form through `useForm()`, while delegating everything else back to Conform's default serializer with `ctx.defaultSerialize`.

This changes the serializer callback signature to:

```ts
serialize(value, ctx) {
  // Custom serialization for a specific field name
  if (ctx.name === 'metadata') {
    return typeof value === 'string' || value == null
      ? value
      : JSON.stringify(value);
  }
  return ctx.defaultSerialize(value, ctx);
}
```
