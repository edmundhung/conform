---
'@conform-to/react': minor
---

Add `fallback` option to `useFormData` hook. When provided, the hook returns the fallback value instead of `undefined` when the form element is not available (e.g., on SSR or initial client render). This also narrows the return type from `Value | undefined` to `Value`.
