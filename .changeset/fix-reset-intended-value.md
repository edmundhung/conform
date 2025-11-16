---
'@conform-to/dom': minor
'@conform-to/react': minor
---

The `intendedValue` option in the `report` helper has been renamed to `value` and now works properly during form resets. Previously, this option was ignored when resetting and the form would always reset to the default value. It now supports updating or resetting forms to a specific value.

```tsx
// Reset form to a specific value after submission
return {
  result: report(submission, {
    reset: true,
    value: updatedData,
  }),
};
```

Conform now checks for stale server results to prevent overriding user changes. When a server result is received, it compares the current DOM state with the original submission payload. If the form was edited after submission (excluding fields skipped on the server or file inputs), the result is ignored.
