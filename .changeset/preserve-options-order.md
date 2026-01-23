---
'@conform-to/dom': minor
'@conform-to/react': minor
---

Add `preserveOptionsOrder` option to `useControl` for multi-select inputs.

By default, `<select multiple>` returns selected values in DOM order. With `preserveOptionsOrder: true`, the order passed to `control.change()` is preserved, and form reset restores the `defaultValue` order.

```tsx
const control = useControl({
  defaultValue: ['c', 'a', 'b'],
  preserveOptionsOrder: true,
});

// control.options returns ['c', 'a', 'b'] instead of DOM order
```
