---
'@conform-to/react': minor
---

**Breaking change in future APIs: `useFormData()`**

The selector is now only called when the form is available. When unavailable, the hook returns `undefined` or the new `fallback` option if provided.

```tsx
// Before
const value = useFormData(formRef, (formData) => {
  if (formData === null) return '';
  return formData.get('name') ?? '';
});

// After
const value = useFormData(formRef, (formData) => formData.get('name') ?? '', {
  fallback: '',
});
```
