# getConstraints

A helper that returns an object containing the validation attributes for each field by introspecting the zod schema.

```tsx
import { getConstraints } from '@conform-to/zod/v3/future';
// or
import { getConstraints } from '@conform-to/zod/v4/future';

const constraint = getConstraints(schema);
```

## Parameters

### `schema`

The value to introspect. If it's not a valid zod schema, the function returns `undefined`.

## Examples

### Deriving constraints from a schema

```tsx
import { getConstraints } from '@conform-to/zod/v3/future';
// or
// import { getConstraints } from '@conform-to/zod/v4/future';
import { z } from 'zod';

const schema = z.object({
  title: z.string().min(5).max(20),
  description: z.string().min(100).max(1000).optional(),
  password: z
    .string()
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
});
const constraint = getConstraints(schema);
// {
//   title: { required: true, minLength: 5, maxLength: 20 },
//   description: { required: false, minLength: 100, maxLength: 1000 },
//   password: {
//     required: true,
//     pattern: '^(?=.*(?:[A-Z]))(?=.*(?:[0-9])).*$',
//   },
// }
```

### Passing constraints to useForm

Call `getConstraints` directly and pass the result to `useForm` to enable native HTML validation attributes (e.g. `required`, `minLength`, `min`, `pattern`) on your form fields:

```tsx
import { useForm } from '@conform-to/react/future';
import { getConstraints } from '@conform-to/zod/v3/future';

const { form, fields } = useForm({
  constraint: getConstraints(schema),
});
```

### Using with configureForms

Pass `getConstraints` to `configureForms` to automatically derive constraints for all forms without repeating it in every `useForm` call:

```tsx
import { configureForms } from '@conform-to/react/future';
import { getConstraints } from '@conform-to/zod/v3/future';

const { useForm } = configureForms({
  getConstraints,
});
```

## Tips

### Pattern limitations

The `pattern` generation is best-effort with the following limitations:

- **Regex flags**: The `i` (case-insensitive) flag is **not supported**. No `pattern` is generated for case-insensitive regexes or when the serialized regex is not a valid HTML `pattern` under the browser's `v` flag.
- **Backreferences**: Numbered backreferences (`\1`, `\2`, etc.) may break when multiple regex validators for the same field are combined into one `pattern`. Named backreferences (`\k<name>`) are more reliable, but each regex combined into the same `pattern` must use unique group names.
