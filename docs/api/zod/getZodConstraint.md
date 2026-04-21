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
import { useForm } from '@conform-to/react';
import { getZodConstraint } from '@conform-to/zod';
// If you are using Zod v4, update the imports:
// import { getZodConstraint } from '@conform-to/zod/v4';
import { z } from 'zod';

const schema = z.object({
  title: z.string().min(5).max(20),
  description: z.string().min(100).max(1000).optional(),
});

function Example() {
  const [form, fields] = useForm({
    constraint: getZodConstraint(schema),
  });

  // ...
}
```

## Pattern constraint

The `getZodConstraint` helper also extracts regex constraints into the HTML5 `pattern` attribute. This enables native browser validation alongside Zod validation.

### Using `z.enum()`

Enum values become a pattern matching any valid option:

```tsx
const schema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']),
});
// Generates pattern: "pending|approved|rejected"
```

### Using `z.string().regex()`

```tsx
const schema = z.object({
  otpCode: z.string().regex(/^\d{4}$/, 'Must be 4 digits'),
});
```

### Limitations

- **Regex flags**: The `i` (case-insensitive) flag is **not supported** — HTML5 `pattern` doesn't support case-insensitive matching.
- **Backreferences**: Numbered backreferences (`\1`, `\2`, etc.) may break across multiple fields in your schema. Named backreferences (`\k<name>`) are more reliable, but require each field's regexes to have unique group names.
