---
'@conform-to/zod': minor
'@conform-to/valibot': minor
---

Deprecated the `includeValue` option on the future `formatResult()` API.

The option will be removed in the next minor release. `formatResult()` will then always return both `error` and `value`, equivalent to the current `includeValue: true` behavior.
