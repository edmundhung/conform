---
'@conform-to/dom': minor
'@conform-to/react': minor
---

Add `getFieldValue` helper to extract and validate field values from FormData or URLSearchParams.

```ts
import { getFieldValue } from '@conform-to/react/future';

// Basic: returns `unknown`
const email = getFieldValue(formData, 'email');

// With type guard: returns `string`, throws if not a string
const name = getFieldValue(formData, 'name', { type: 'string' });

// File type: returns `File`, throws if not a File
const avatar = getFieldValue(formData, 'avatar', { type: 'file' });

// Object type: parses nested fields into `{ city: unknown, ... }`
const address = getFieldValue<Address>(formData, 'address', { type: 'object' });

// Array: returns `unknown[]`
const tags = getFieldValue(formData, 'tags', { array: true });

// Array of objects: returns `Array<{ name: unknown, ... }>`
const items = getFieldValue<Item[]>(formData, 'items', {
  type: 'object',
  array: true,
});

// Optional: returns `string | undefined`, no error if missing
const bio = getFieldValue(formData, 'bio', { type: 'string', optional: true });
```

It also infers types from the field name:

```ts
import { useForm, useFormData, getFieldValue } from '@conform-to/react/future';

function Example() {
  const { form, fields } = useForm();
  // Retrieves the value of the `address` fieldset as an object, e.g. `{ city: unknown; ... }`
  const address = useFormData(form.id, (formData) =>
    getFieldValue(formData, fields.address.name, { type: 'object' }),
  );

  // ...
}
```
