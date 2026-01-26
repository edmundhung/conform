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
