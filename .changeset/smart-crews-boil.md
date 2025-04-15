---
'@conform-to/react': minor
'@conform-to/dom': minor
---

feat: enable form side effect

Previously, Conform heavily relied on the React `key` prop to update the input value when updating field values with `form.update()` or resetting the form with `form.reset()`.This was not ideal and have introduced several issues along the way, such as the unexpected `onBlur` validation behavior caused by React re-mounting the input when the `key` prop changes (#801) and the new warning message with spreading `key` with `getInputProps()` in React 19 (#600).

Conform now runs a side effect to update the input value directly and therefore helpers like `getInputProps` will no longer return a `key` prop as it is no longer necessary.

With the need of `key` props removed, Conform is now able to validate and update the input value as long as a `name` is provided:

```tsx
function Example() {
  const [form, fields] = useForm({
    // ...
  });

  return (
    <form id={form.id} onSubmit={form.onSubmit}>
      <input type="text" name="username" />
      <input type="password" name="password" />
      <button>Submit</button>
    </form>
  );
}
```
