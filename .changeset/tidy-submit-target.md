---
'@conform-to/react': minor
---

Deprecated the `value` option on the `update()` function provided to the future `onSubmit` handler. Use `targetValue` instead:

```diff
 onSubmit(event, { value, update }) {
   event.preventDefault();
   update({
     reset: true,
-    value,
+    targetValue: value,
   });
 }
```

`value` remains available as an alias and will be removed in the next minor version. If both options are provided, `targetValue` takes precedence.
