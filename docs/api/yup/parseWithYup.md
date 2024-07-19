# parseWithYup

A helper that returns an overview of the submission by parsing the form data with the provided yup schema.

```tsx
const submission = parseWithYup(payload, options);
```

## Parameters

### `payload`

It could be either the **FormData** or **URLSearchParams** object depending on how the form is submitted.

### `options`

#### `schema`

Either a yup schema or a function that returns a yup schema.

#### `async`

Set it to **true** if you want to parse the form data with **validate** method from the yup schema instead of **validateSync**.

## Example

```tsx
import { parseWithYup } from '@conform-to/zod';
import { useForm } from '@conform-to/react';
import * as yup from 'yup';

const schema = yup.object({
  email: yup.string().email(),
  password: yup.string(),
});

function Example() {
  const [form, fields] = useForm({
    onValidate({ formData }) {
      return parseWithYup(formData, { schema });
    },
  });

  // ...
}
```
