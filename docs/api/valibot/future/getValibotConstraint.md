# getValibotConstraint

A helper that returns an object containing the validation attributes for each field by introspecting the valibot schema.

```tsx
import { getValibotConstraint } from '@conform-to/valibot/future';
import * as v from 'valibot';

const constraint = getValibotConstraint(
  v.object({
    title: v.pipe(v.string(), v.minLength(5), v.maxLength(20)),
    description: v.optional(
      v.pipe(v.string(), v.minLength(100), v.maxLength(1000)),
    ),
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

- `Record<string, Constraint>` - An object containing validation attributes for each field if the schema is a Valibot schema
- `null` - If the schema is not a Valibot schema

## Tips

### Setup with useForm

Pass `getValibotConstraint` to `useForm` to derive HTML validation attributes from your schema:

```tsx
import { getValibotConstraint } from '@conform-to/valibot/future';
import { useForm } from '@conform-to/react';
import * as v from 'valibot';

const schema = v.object({
  title: v.pipe(v.string(), v.minLength(5), v.maxLength(20)),
  description: v.optional(
    v.pipe(v.string(), v.minLength(100), v.maxLength(1000)),
  ),
});

function Example() {
  const [form, fields] = useForm({
    constraint: getValibotConstraint(schema),
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

To avoid repeating the configuration across multiple forms, you can set `getValibotConstraint` globally with `FormOptionsProvider`:

```tsx
import { FormOptionsProvider } from '@conform-to/react/future';
import { getValibotConstraint } from '@conform-to/valibot/future';

function App() {
  return (
    <FormOptionsProvider getConstraint={getValibotConstraint}>
      <Main />
    </FormOptionsProvider>
  );
}
```
