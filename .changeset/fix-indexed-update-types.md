---
'@conform-to/react': patch
---

Reject extra properties in `intent.update()` values when updating an array item with `index`.

```ts
intent.update({
  name: tasks.name,
  index: 0,
  value: {
    content: 'Write changelog',
    // @ts-expect-error extra properties are rejected
    extra: true,
  },
});
```
