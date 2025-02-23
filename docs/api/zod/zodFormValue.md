# unstable_zodFormValue

A helper that enhances the schema with extra preprocessing steps to strip empty value and coerce form value to the expected type.

```tsx
const enhancedSchema = zodFormValue(schema, options);
```

The following rules will be applied by default:

1. If the value is an empty string / file, pass `undefined` to the schema
2. If the schema is `z.number()`, trim the value and cast it with the `Number` constructor
3. If the schema is `z.boolean()`, treat the value as `true` if it equals to `on` (Browser default `value` of a checkbox / radio button)
4. If the schema is `z.date()`, cast the value with the `Date` constructor
5. If the schema is `z.bigint()`, cast the value with the `BigInt` constructor

## Parameters

### `schema`

The zod schema to be enhanced.

### `options.coerceTypes`

Specify the type to be coerced. Default to `["number", "boolean", "date", "bigint"]`. Set it to `false` to disable type coercion completely.

## Example

```tsx
import { parseWithZod, unstable_zodFormValue as zodFormValue } from '@conform-to/zod';
import { useForm } from '@conform-to/react';
import { z } from 'zod';

const schema = zodFormValue(
  z.object({
    ref: z.number()
    date: z.date(),
    amount: z.number(),
    confirm: z.boolean(),
  }),
  {
    coerceTypes(type, value, defaultResult) {
      switch (type) {
        case 'number':
          return Number(value.trim().replace(/,/g, ''));
        case 'date':
          return new Date(value.trim());
        case 'bigint':
          return BigInt(value.trim().replace(/,/g, ''));
        case 'boolean':
          return value === 'yes';
        default:
          return defaultResult;
      }
    }
  },
);

function Example() {
  const [form, fields] = useForm({
    onValidate({ formData }) {
      return parseWithZod(formData, {
        schema,
        defaultTypeCoercion: false,
      });
    },
  });

  // ...
}
```

## Tips

### Override default behavior

You can override the default coercion logic by casting the value yourself inside `z.preprocess`.

```tsx
const schema = zodFormValue(
  z.object({
    // Override how the `amount` field value is coerced
    amount: z.preprocess((value) => {
      // If no value is provided, return `undefined`
      if (!value) {
        return undefined;
      }

      // Clear the formatting and cast the value to number
      return Number(value.trim().replace(/,/g, ''));
    }, z.number()),

    // Keep the default behavior
    number: z.number(),
  }),
);
```

### Default values

`zodFormValue` will always strip empty values to `undefined`. If you need a default value, use `.transform()` to define a fallback value that will be returned instead.

```tsx
const schema = z.object({
  foo: z.string().optional(), // string | undefined
  bar: z
    .string()
    .optional()
    .transform((value) => value ?? ''), // string
  baz: z
    .string()
    .optional()
    .transform((value) => value ?? null), // string | null
});
```
