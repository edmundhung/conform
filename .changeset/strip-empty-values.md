---
'@conform-to/dom': minor
---

`parseSubmission` now strips empty values by default. This makes it easier to work with schemas directly (without `coerceFormValue`) since you no longer need extra validation like `.min(1)` for required fields. You can set `stripEmptyValues: false` to preserve empty values if needed.

```ts
const formData = new FormData();
// Empty text input
formData.append('name', '');
// Empty file input
formData.append('files[]', new File([], ''));

parseSubmission(formData);
// { payload: {} }

parseSubmission(formData, { stripEmptyValues: false });
// { payload: { name: '', files: [new File([], '')] } }
```
