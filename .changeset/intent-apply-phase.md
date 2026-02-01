---
'@conform-to/react': minor
---

feat: add dynamic behavior options for array intents

Array intents (`insert`/`remove`) can now change behavior based on validation errors using `onInvalid` and `from` options.

```tsx
intent.insert({
  name: fields.tags.name,
  // Read and validate a value from another field before inserting.
  // If valid, the value is inserted and the source field is cleared.
  // If invalid, the error is shown on that field.
  from: fields.newTag.name,
  // Cancel the insert if it causes array validation errors (e.g., exceeding max items)
  onInvalid: 'revert',
});

intent.remove({
  name: fields.tags.name,
  index: 0,
  // Cancel the removal if it causes validation errors (e.g., going below min items)
  onInvalid: 'revert',
  // Or use 'insert' to continue removing but insert a new item at the end
  // onInvalid: 'insert',
});
```

These options require the validation error to be available synchronously. See the docs for guidance on combining with async validation.
