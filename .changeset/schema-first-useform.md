---
'@conform-to/react': minor
---

**Schema-first `useForm` API with improved type inference**

The `schema` option is now promoted to the first argument of `useForm` for better type inference:

```tsx
// Before: schema in options
const { form, fields } = useForm({
  schema: mySchema,
  onSubmit(event, { value }) {
    // value type inference could be inconsistent
  },
});

// After: schema as first argument
const { form, fields } = useForm(mySchema, {
  onSubmit(event, { value }) {
    // value is fully typed based on your schema
  },
});
```

- `onValidate` is now required when not using a schema
- Either `onSubmit` or `lastResult` must be provided

The old API with `schema` in options still works but is now deprecated.
