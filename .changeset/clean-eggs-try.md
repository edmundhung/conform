---
'@conform-to/zod': minor
---

Add `formatResult` and `memoize` helpers to future exports

- **`formatResult`**: Transforms Zod validation results into Conform's error format, supporting value extraction and custom error formatting
- **`memoize`**: Caches most recent result to prevent redundant API calls during async validation

Both helpers are available in `@conform-to/zod/v3/future` and `@conform-to/zod/v4/future`
