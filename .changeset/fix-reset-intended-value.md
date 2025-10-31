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
