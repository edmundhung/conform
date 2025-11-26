---
'@conform-to/dom': patch
---

Fix `parseSubmission` array handling for entries ending with `[]`. Previously, when multiple form entries had the same name ending with `[]` (e.g., `todos[]`), all items were incorrectly pushed as a single nested array element. Now they are correctly spread as individual array items.

```ts
const formData = new FormData();
formData.append('todos[]', 'Buy milk');
formData.append('todos[]', 'Walk dog');
formData.append('todos[]', 'Write tests');

parseSubmission(formData);
// Before: { todos: [['Buy milk', 'Walk dog', 'Write tests']] }
// After:  { todos: ['Buy milk', 'Walk dog', 'Write tests'] }
```
