---
'@conform-to/zod': patch
---

fix: prevent stack overflow with Zod v4 getter-based recursive schemas

`coerceFormValue` and `getZodConstraint` no longer cause infinite recursion when used with the recommended getter-based recursive schema pattern in Zod v4.
