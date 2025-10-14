---
'@conform-to/react': minor
---

feat(future): add `formRef` to `useControl` hook

The `useControl` hook now exposes a `formRef` property that provides access to the form element associated with the registered input. This is particularly useful when using `useControl` with other form-level hooks like `useFormData()` and `useIntent()`.

```tsx
const control = useControl({ defaultValue: '' });

// Dispatch intent with useIntent
const intent = useIntent(control.formRef);

// The formRef automatically stays in sync even if the form attribute changes
<input ref={control.register} form="dynamic-form-id" />;
```
