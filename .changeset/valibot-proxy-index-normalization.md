---
'@conform-to/valibot': minor
---

feat: support recursive schemas in `getConstraint` and `coerceFormValue`

`getConstraint` now correctly returns constraints for fields inside recursive schemas using `v.lazy()`. Constraint lookups for indexed paths (e.g., `items[0].name`) also resolve to their normalized form (`items[].name`). While `coerceFormValue` now handles `v.lazy()` schemas, applying type coercion to fields inside recursive structures.

```ts
const treeSchema = v.object({
  value: v.number(),
  children: v.array(v.lazy(() => treeSchema)),
});

// children[0].value is now correctly coerced to a number
const schema = coerceFormValue(treeSchema);
const constraint = getValibotConstraint(treeSchema);

// Constraints for nested fields inside v.lazy() are now correctly resolved
constraint['children[2].children[1].value'];
// ^? { required: true }
```
