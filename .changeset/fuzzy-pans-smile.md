---
'@conform-to/react': minor
---

feat: accept URLSearchParams as the form default value

`useForm` can now parse URL search parameters directly. The parameters are parsed only when the form is initialized or reset:

```ts
const { form, fields } = useForm({
  defaultValue: new URLSearchParams(window.location.search),
});
```
