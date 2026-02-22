# unstable_coerceFormValue

> The `coerceFormValue` function is also available as part of Conform's future export. [Check it out](./future/coerceFormValue.md) if you want to use it with other future APIs.

A helper that enhances the schema with extra preprocessing steps to strip empty values and coerce form values to the expected type. To customize the coercion behavior, use [`configureCoercion`](./future/configureCoercion.md) from the future export.

```ts
const enhancedSchema = coerceFormValue(schema);
```

The following rules are applied by default:

1. If the value is an empty string / file, pass `undefined` to the schema
2. If the schema is `z.number()`, trim the value and cast it with the `Number` constructor
3. If the schema is `z.boolean()`, treat the value as `true` if it equals `on` (browser default `value` of a checkbox / radio button)
4. If the schema is `z.date()`, cast the value with the `Date` constructor
5. If the schema is `z.bigint()`, trim the value and cast it with the `BigInt` constructor

## Parameters

### `schema`

The zod schema to be enhanced.

## Example

```ts
import { useForm } from '@conform-to/react';
import {
  parseWithZod,
  unstable_coerceFormValue as coerceFormValue,
} from '@conform-to/zod';
// If you are using Zod v4, update the imports:
// import { parseWithZod, unstable_coerceFormValue as coerceFormValue } from '@conform-to/zod/v4';
import { z } from 'zod';

const schema = coerceFormValue(
  z.object({
    ref: z.string(),
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
        disableAutoCoercion: true,
      });
    },
  });

  // ...
}
```

## Tips

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
