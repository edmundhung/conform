---
'@conform-to/react': minor
'@conform-to/dom': minor
---

The `intent.reset()` method now accepts an optional `defaultValue` parameter to reset forms to a different value:

```tsx
// Clear all fields
<button type="button" onClick={() => intent.reset({ defaultValue: null })}>
  Clear
</button>

// Restore to a specific snapshot
<button type="button" onClick={() => intent.reset({ defaultValue: savedValue })}>
  Restore
</button>
```

This is useful for filter forms where the initial `defaultValue` comes from URL parameters, but you want a "Clear" button that empties all fields.

Additionally, `intent.update()` has been optimized to behave more consistently with `intent.reset()`, with improved type inference when updating multiple fields at once
