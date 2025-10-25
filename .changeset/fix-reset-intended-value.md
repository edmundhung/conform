---
'@conform-to/dom': minor
'@conform-to/react': minor
---

Add support for resetting forms to a specific intended value. Previously, `intendedValue` was ignored during reset and the form would simply reset to the current default value instead. This also fixes `intendedValue` support without reset, and allows dispatching multiple intents that include a reset intent.

```tsx
// Reset form to a specific value after submission
return {
  result: report(submission, {
    reset: true,
    intendedValue: updatedData,
  }),
};
```

However, this includes one breaking change: providing `null` to `intendedValue` now clears the form without triggering a reset, unless the `reset` option is explicitly set.
