---
'@conform-to/dom': minor
'@conform-to/react': minor
---

Deprecated the `value` option in the future `report()` API. Use `targetValue` instead:

```diff
 report(submission, {
-  value,
+  targetValue,
 });
```

`value` remains available as an alias and will be removed in the next minor version. If both options are provided, `targetValue` takes precedence.
