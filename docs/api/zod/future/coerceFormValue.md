# coerceFormValue

> The `coerceFormValue` function is part of Conform's future export. These APIs are experimental and may change in minor versions. [Learn more](https://github.com/edmundhung/conform/discussions/954)

A helper that enhances the schema with extra preprocessing steps to strip empty values and coerce form values to the expected type. To customize the coercion behavior, use [`configureCoercion`](./configureCoercion.md).

```ts
import { coerceFormValue } from '@conform-to/zod/v3/future'; // Or '@conform-to/zod/v4/future'

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
import { coerceFormValue } from '@conform-to/zod/v3/future'; // Or '@conform-to/zod/v4/future'
import { useForm } from '@conform-to/react/future';
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
  const { form, fields } = useForm(schema, {
    // ...
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
