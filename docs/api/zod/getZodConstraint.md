# getZodConstraint

A helper that returns an object containing the validation attributes for each field by introspecting the zod schema.

```tsx
const constraint = getZodConstraint(schema);
```

## Parameters

### `schema`

The zod schema to be introspected.

## Example

```tsx
import { getZodConstraint } from '@conform-to/zod';
// If you are using Zod v4, update the imports:
// import { getZodConstraint } from '@conform-to/zod/v4';
import { z } from 'zod';

const schema = z.object({
  title: z.string().min(5).max(20),
  description: z.string().min(100).max(1000).optional(),
  password: z
    .string()
    .regex(/[A-Z]/, 'Must contain an uppercase letter')
    .regex(/[0-9]/, 'Must contain a number'),
});
const constraint = getZodConstraint(schema);
// {
//   title: { required: true, minLength: 5, maxLength: 20 },
//   description: { required: false, minLength: 100, maxLength: 1000 },
//   password: {
//     required: true,
//     pattern: '^(?=.*(?:[A-Z]))(?=.*(?:[0-9])).*$',
//   },
// }
```

## Tips

### Pattern limitations

The `pattern` generation is best-effort with the following limitations:

- **Regex flags**: The `i` (case-insensitive) flag is **not supported**. No `pattern` is generated for case-insensitive regexes or when the serialized regex is not a valid HTML `pattern` under the browser's `v` flag.
- **Backreferences**: Numbered backreferences (`\1`, `\2`, etc.) may break when multiple regex validators for the same field are combined into one `pattern`. Named backreferences (`\k<name>`) are more reliable, but each regex combined into the same `pattern` must use unique group names.
