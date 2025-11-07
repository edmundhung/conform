# getZodConstraint

A helper that returns an object containing the validation attributes for each field by introspecting the zod schema.

```tsx
import { getZodConstraint } from '@conform-to/zod/v3/future'; // Or '@conform-to/zod/v4/future'
import { z } from 'zod';

const constraint = getZodConstraint(
  z.object({
    title: z.string().min(5).max(20),
    description: z.string().min(100).max(1000).optional(),
  }),
);
// Returns:
// {
//   title: { required: true, minLength: 5, maxLength: 20 },
//   description: { required: false, minLength: 100, maxLength: 1000 }
// }
```

## Parameters

### `schema`

The schema to be introspected.

## Returns

- `Record<string, Constraint>` - An object containing validation attributes for each field if the schema is a Zod schema
- `null` - If the schema is not a Zod schema

## Tips

### Setup with useForm

Pass `getZodConstraint` to `useForm` to derive HTML validation attributes from your schema:

```tsx
import { getZodConstraint } from '@conform-to/zod/v3/future';
import { useForm } from '@conform-to/react';
import { z } from 'zod';

const schema = z.object({
  title: z.string().min(5).max(20),
  description: z.string().min(100).max(1000).optional(),
});

function Example() {
  const [form, fields] = useForm({
    constraint: getZodConstraint(schema),
  });

  // fields.title.required === true
  // fields.title.minLength === 5
  // fields.title.maxLength === 20
  // fields.description.required === false
  // fields.description.minLength === 100
  // fields.description.maxLength === 1000
}
```

### Setup with FormOptionsProvider

To avoid repeating the configuration across multiple forms, you can set `getZodConstraint` globally with `FormOptionsProvider`:

```tsx
import { FormOptionsProvider } from '@conform-to/react/future';
import { getZodConstraint } from '@conform-to/zod/v3/future';

function App() {
  return (
    <FormOptionsProvider getConstraint={getZodConstraint}>
      <Main />
    </FormOptionsProvider>
  );
}
```
