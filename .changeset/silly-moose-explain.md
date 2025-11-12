---
'@conform-to/react': minor
---

Form metadata now exposes `defaultValue`. As default values can be set through the `useForm` hook, reset intents, or server result, this provides clarity on the current baseline for features like dirty checking.

```tsx
const form = useFormMetadata();
const dirty = useFormData(
  form.id,
  (formData) => isDirty(formData, { defaultValue: form.defaultValue }) ?? false,
);
```
