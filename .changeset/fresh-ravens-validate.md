---
'@conform-to/react': minor
---

Refine the experimental future validation-result contract.

Returning staged validation from `onValidate` has a breaking change. Replace the positional tuple with a descriptive object:

```diff
-return [
-  error,
-  validateRemotely(),
-];
+return {
+  result: error,
+  pending: validateRemotely(),
+};
```

The `pending` promise must resolve to the complete later validation result that replaces `result`.

This also fixes synchronous `null` handling. `null` now consistently means that validation completed successfully and clears any previous client error; only `undefined` means no synchronous validation result was provided.
