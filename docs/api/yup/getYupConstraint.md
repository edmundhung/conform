# getYupConstraint

A helper that returns an object containing the validation attributes for each field by introspecting the yup schema.

```tsx
const constraint = getYupConstraint(schema);
```

## Parameters

### `schema`

The yup schema to be introspected.

## Example

```tsx
import { getYupConstraint } from '@conform-to/yup';
import { useForm } from '@conform-to/react';
import * as yup from 'yup';

const schema = yup.object({
  title: yup.string().required().min(5).max(20),
  description: yup.string().optional().min(100).max(1000),
});

function Example() {
  const [form, fields] = useForm({
    constraint: getYupConstraint(schema),
  });

  // ...
}
```
