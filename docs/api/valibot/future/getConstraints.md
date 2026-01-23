# getConstraints

A helper that returns an object containing the validation attributes for each field by introspecting the valibot schema.

```tsx
import { getConstraints } from '@conform-to/valibot/future';

const constraint = getConstraints(schema);
```

## Parameters

### `schema`

The value to introspect. If it's not a valid valibot schema, the function returns `undefined`.

## Examples

### Passing constraints to useForm

Call `getConstraints` directly and pass the result to `useForm` to enable native HTML validation attributes (e.g. `required`, `minLength`, `min`, `pattern`) on your form fields:

```tsx
import { useForm } from '@conform-to/react/future';
import { getConstraints } from '@conform-to/valibot/future';

const { form, fields } = useForm({
  constraint: getConstraints(schema),
});
```

### Using with configureForms

Pass `getConstraints` to `configureForms` to automatically derive constraints for all forms without repeating it in every `useForm` call:

```tsx
import { configureForms } from '@conform-to/react/future';
import { getConstraints } from '@conform-to/valibot/future';

const { useForm } = configureForms({
  getConstraints,
});
```
