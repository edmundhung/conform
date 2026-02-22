---
'@conform-to/valibot': minor
---

feat: add coercion support for `v.lazy()`

`coerceFormValue` now correctly traverse `v.lazy()` schemas. Previously, schemas inside `v.lazy()` were skipped, so coercion (e.g. string to number) was not applied to recursive types.

```ts
const treeSchema = v.object({
  value: v.number(),
  children: v.array(v.lazy(() => treeSchema)),
});

// value.children[0].value is now correctly coerced to a number
const schema = coerceFormValue(treeSchema);
```
