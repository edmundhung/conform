# getValibotConstraint

A helper that returns an object containing the validation attributes for each field by introspecting the valibot schema.

```tsx
const constraint = getValibotConstraint(schema);
```

## Parameters

### `schema`

The valibot schema to be introspected.

## Example

```tsx
import { getValibotConstraint } from '@conform-to/valibot';
import { useForm } from '@conform-to/react';
import { object, pipe, string, minLength, optional } from 'valibot';

const schema = object({
  title: pipe(string(), minLength(5), maxLength(20)),
  description: optional(pipe(string(), minLength(100), maxLength(1000))),
});

function Example() {
  const [form, fields] = useForm({
    constraint: getValibotConstraint(schema),
  });

  // ...
}
```
