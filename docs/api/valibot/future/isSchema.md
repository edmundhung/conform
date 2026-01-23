# isSchema

A type guard to check if a value is a valid valibot schema.

```tsx
import { isSchema } from '@conform-to/valibot/future';

if (isSchema(value)) {
  // value is a valibot schema
}
```

## Parameters

### `value`

The value to check.

## Returns

Returns `true` if the value is a valid valibot schema, `false` otherwise.

## Example

Use `isSchema` to restrict what schema types your forms accept. This narrows down the types for the `validateSchema` option:

```tsx
import { configureForms } from '@conform-to/react/future';
import { isSchema } from '@conform-to/valibot/future';

const { useForm } = configureForms({
  isSchema,
  validateSchema(schema, payload) {
    // schema is now typed as a valibot schema
  },
});
```
