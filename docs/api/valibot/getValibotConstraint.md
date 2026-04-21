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

## Pattern constraint

The `getValibotConstraint` helper also extracts regex constraints into the HTML5 `pattern` attribute. This enables native browser validation alongside Valibot validation.

### Using `enumType()`

Enum values become a pattern matching any valid option:

```tsx
import { enumType } from 'valibot';

const schema = object({
  status: enumType(['pending', 'approved', 'rejected']),
});
// Generates pattern: "pending|approved|rejected"
```

### Using `regex()`

```tsx
import { regex } from 'valibot';

const schema = object({
  otpCode: pipe(string(), regex(/^\d{4}$/, 'Must be 4 digits')),
});
```

### Limitations

- **Regex flags**: The `i` (case-insensitive) flag is **not supported** — HTML5 `pattern` doesn't support case-insensitive matching.
- **Backreferences**: Numbered backreferences (`\1`, `\2`, etc.) may break across multiple fields in your schema. Named backreferences (`\k<name>`) are more reliable, but require each field's regexes to have unique group names.
