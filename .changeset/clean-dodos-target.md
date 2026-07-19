---
'@conform-to/dom': minor
'@conform-to/react': minor
---

Align the experimental future APIs on `targetValue` for the form value produced by resolving an intent and applied by a submission result.

The `resolveSubmission()` result has a breaking change:

```diff
-const { intent, value } = resolveSubmission(submission);
+const { intent, targetValue } = resolveSubmission(submission);
```

The `report()` option is renamed too, but `value` remains available as a deprecated alias for one minor release:

```diff
 report(submission, {
-  value,
+  targetValue,
 });
```

`value` will be removed from `report()` in the next minor release. If both `value` and `targetValue` are provided during migration, `targetValue` takes precedence.
