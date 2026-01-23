# isSchema

A type guard to check if a value is a valid zod schema.

```tsx
import { isSchema } from '@conform-to/zod/v3/future';
// or
import { isSchema } from '@conform-to/zod/v4/future';

if (isSchema(value)) {
  // value is a ZodTypeAny
}
```

## Parameters

### `value`

The value to check.

## Returns

Returns `true` if the value is a valid zod schema, `false` otherwise.

## Example

Use `isSchema` to restrict what schema types your forms accept. This narrows down the types for the `validateSchema` option:

```tsx
import { configureForms } from '@conform-to/react/future';
import { isSchema } from '@conform-to/zod/v3/future';

const { useForm } = configureForms({
  isSchema,
  validateSchema(schema, payload) {
    // schema is now typed as ZodTypeAny
  },
});
```
