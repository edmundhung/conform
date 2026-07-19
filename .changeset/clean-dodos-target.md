---
'@conform-to/react': minor
---

Breaking Change: Renamed the result `value` to `targetValue` in the future `resolveSubmission()` API.

```diff
-const { intent, value } = resolveSubmission(submission);
+const { intent, targetValue } = resolveSubmission(submission);
```
