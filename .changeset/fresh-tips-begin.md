---
'@conform-to/react': minor
'@conform-to/dom': minor
---

feat: add standard schema issue support to `report`

The `report` helper now accepts standard schema issues directly, eliminating the need to use `formatResult` in most cases:

```diff
return report(submission, {
+  error: { issues: result.error.issues },  // Zod
+  error: { issues: result.issues },        // Valibot
-  error: formatResult(result),
});
```

When both `issues` and `formErrors` / `fieldErrors` are provided, they will be merged together, with `issues` being formatted first:

```ts
return report(submission, {
  error: {
    issues: result.error.issues,
    formErrors: ['Custom form error'],
  },
});
```

This simplifies error handling by allowing direct pass-through of validation results from Zod and Valibot. The `formatResult` function is still useful when you need to customize the error shape.
