# unstable_coerceFormValue

> No translation available for this page. Here is the English version.

A helper that enhances the schema with extra preprocessing steps to strip empty value and coerce form value to the expected type.

```ts
const enhancedSchema = coerceFormValue(schema, options);
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

### `options.skipCoercion`

Optional. You can use it to skip type coercion for a specific schema.

## Example

```ts
import { parseWithZod, unstable_coerceFormValue as coerceFormValue } from '@conform-to/zod';
import { useForm } from '@conform-to/react';
import { z } from 'zod';
import { jsonSchema } from './jsonSchema';

const schema = coerceFormValue(
  z.object({
    ref: z.string()
    date: z.date(),
    amount: z.number(),
    confirm: z.boolean(),
  }),
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

You can override the default coercion logic without disabling the type coercion by casting the value yourself inside `z.preprocess`.

```ts
const schema = coerceFormValue(
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

`coerceFormValue` will always strip empty values to `undefined`. If you need a default value, use `.transform()` to define a fallback value that will be returned instead.

```ts
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

### Skip coercion

You can always skip the default coercion for a specific schema by setting the `skipCoercion` option.

```ts
import { parseWithZod, unstable_coerceFormValue as coerceFormValue } from '@conform-to/zod';
import { useForm } from '@conform-to/react';
import { z } from 'zod';
import { json } from './schema';

const schema = coerceFormValue(
  z.object({
    ref: z.number()
    date: z.date(),
    amount: z.preprocess((value) => {
      // Ignore non-string values
      if (typeof value !== 'string') {
        return value;
      }

      // If it is an empty string, return `undefined`
      if (!value) {
        return undefined;
      }

      // Clear the formatting and cast the value to number
      return Number(value.trim().replace(/,/g, ''));
    }, z.number())
    confirm: z.boolean(),
    meta: json,
  }),
  {
    skipCoercion(type) {
      // To skip coercion for all fields defined with z.number() or jsonSchema
      return type instanceof z.ZodNumber || type === json;
    }
  },
);
```
