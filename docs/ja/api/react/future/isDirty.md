# isDirty

> The `isDirty` function is part of Conform's future export. These APIs are experimental and may change in minor versions. [Learn more](https://github.com/edmundhung/conform/discussions/954)

A utility function that checks whether the current form data differs from the default values.

```ts
import { isDirty } from '@conform-to/react/future';

const dirty = isDirty(formData, options);
```

## Parameters

### `formData: FormData | URLSearchParams | Record<string, unknown> | null`

The current form data to compare. It can be:

- A `FormData` object
- A `URLSearchParams` object
- A plain object that was parsed from form data (i.e. `submission.payload`)

### `options.defaultValue?: Record<string, unknown> | null`

An object representing the default values of the form to compare against. Defaults to an empty object if not provided.

### `options.serialize?: (value: unknown) => string | File | undefined`

A function to serialize values in defaultValue before comparing them to the form data. If not provided, a default serializer is used that behaves as follows:

- boolean:
  - true → 'on'
  - false → undefined
- Date:
  - Converted to ISO string (`.toISOString()`)
- number / bigint:
  - Converted to string using `.toString()`
- string / File:
  - Returned as-is

### `options.skipEntry?: (name: string) => boolean`

A function to exclude specific fields from the comparison. Useful for ignoring hidden inputs like CSRF tokens.

```ts
isDirty(formData, {
  skipEntry: (name) => name === 'csrf-token',
});
```

### `options.intentName?: string`

If set, any entry matching this name will be ignored during comparison.
This is useful when using an intent input to distinguish between multiple actions.

## Returns

- `true` if the current form data is different from the default values
- `false` if it matches
- `undefined` if formData is `null`

## Example

### Enable a submit button only if the form is dirty

```tsx
const dirty = useFormData(
  formRef,
  (formData) => isDirty(formData, { defaultValue }) ?? false,
);

return (
  <button type="submit" disabled={!dirty}>
    Save changes
  </button>
);
```

### Submit the form only if the form is dirty

```tsx
const [form, fields] = useForm({
  defaultValue,
  onSubmit: (event, submission) => {
    if (!isDirty(submission.payload, { defaultValue })) {
      // Prevent submission if there are no changes
      event.preventDefault();
    }

    // Handle submission
  },
});
```

### Process form submission on the server only if the form is dirty

```ts
export async function action({ request }) {
  const formData = await request.formData();
  const submission = parse(formData, {
    // ...
  });

  if (submission.status !== 'success') {
    // Handle validation errors as usual
    return submission.reply();
  }

  if (isDirty(submission.payload, { defaultValue })) {
    // Process the submission / save changes only if the form is dirty
  }

  return redirect('/success');
}
```
