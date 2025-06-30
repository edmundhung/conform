# useFormData

> The `useFormData` hook is part of Conform's future export. These APIs are experimental and may change in minor versions. [Learn more](https://github.com/edmundhung/conform/discussions/954)

A React hook that lets you subscribe to the current `FormData` of a form and derive a custom value from it. The selector runs whenever the form's structure or data changes, and the hook re-renders only when the result is deeply different.

```ts
const result = useFormData(formRef, selector, options);
```

To detect form updates, the hook listens to:

- Form events: `input`, `focusout`, `submit`, and `reset`
- DOM mutations:
  - When inputs are mounted or unmounted
  - When the `name`, `form`, or `data-conform` attributes change

> Manual changes to input values (e.g. `input.value = 'foo'`) are not tracked unless they also trigger an event or update the `data-conform` attribute.

## Parameters

### `fromRef?: FormRef`

A reference to the form to observe. You can pass either:

- A ref object from `useRef()`, pointing to a form-associated element (e.g. `<form>`, `<input>`, `<button>`, etc.)
- A string ID of a form element

### `selector?: (formData: FormData | URLSearchParams, lastResult?: Result) => Result`

A function that derives a value from the current form data. It receives:

- The current form data, which may be:
  - a `URLSearchParams` object if the `acceptFiles` option is not set or `false`
  - a `FormData` object if `acceptFiles: true`
  - `null` — on the server, or on the client if the form is not available
- The previously returned value (or undefined on first render)

The hook will re-run the selector whenever the form changes, and trigger a re-render only if the returned value is not deeply equal to the previous one.

### `options.acceptFiles?: boolean`

Set to `true` to preserve file inputs and receive a `FormData` object in the selector.
If omitted or `false`, the selector receives a `URLSearchParams` object, where all values are coerced to strings.

## Returns

The Value returned by your select function. Its type is fully generic and reflects what you extract from the form.

## Example Usage

### Derive a single field value

```tsx
const name = useFormData(formRef, (formData) => formData?.get('name') ?? '');

return <p>Hello, {name || 'guest'}!</p>;
```

### Compute a summary from multiple fields

```tsx
const total = useFormData(formRef, (formData) => {
  if (!formData) return 0;

  const prices = ['itemA', 'itemB', 'itemC'];
  return prices.reduce((sum, name) => {
    const value = parseFloat(formData.get(name));
    return sum + (isNaN(value) ? 0 : value);
  }, 0);
});

return <p>Total: ${total.toFixed(2)}</p>;
```

### Conditionally show a section based on the form data

```tsx
const isSubscribed = useFormData(
  formRef,
  (formData) => formData?.get('subscribe') === 'on' ?? false,
);

return (
  <>
    <label>
      <input type="checkbox" name="subscribe" />
      Subscribe to newsletter
    </label>

    {isSubscribed && <NewsletterPreferences />}
  </>
);
```

## Tips

### You can use any form-related element as the reference

You don't need to pass a reference to the `<form>` element itself. The hook will resolve the associated form automatically, either by:

- the `form` attribute (e.g. `<button form="my-form">`)
- or by traversing up the DOM to find the closest `<form>` ancestor

For example, here's how you might disable an **Add to Cart** button if the item is already selected in the form:

```tsx
function AddToCartButton({ itemId }: { itemId: string }) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const isAdded = useFormData(
    buttonRef,
    (formData) => formData?.getAll('items')?.includes(itemId) ?? false,
  );

  return (
    <button ref={buttonRef} disabled={isAdded}>
      Add to Cart
    </button>
  );
}
```
