# coerceFormValue

> The `coerceFormValue` function is part of Conform's future export. These APIs are experimental and may change in minor versions. [Learn more](https://github.com/edmundhung/conform/discussions/954)

A helper that enhances the schema with extra preprocessing steps to strip empty value and coerce form value to the expected type.

```ts
import { coerceFormValue } from '@conform-to/zod/v3/future'; // Or import `@conform-to/zod/v4/future`.

const enhancedSchema = coerceFormValue(schema, options);
```

The following rules will be applied by default:

1. If the value is an empty string / file, pass `undefined` to the schema
2. If the schema is `z.number()`, trim the value and cast it with the `Number` constructor
3. If the schema is `z.boolean()`, treat the value as `true` if it equals to `on` (Browser default `value` of a checkbox / radio button)
4. If the schema is `z.date()`, cast the value with the `Date` constructor
5. If the schema is `z.bigint()`, trim the value and cast it with the `BigInt` constructor

## Parameters

### `schema`

The zod schema to be enhanced.

### `options.defaultCoercion`

Optional. Set it if you want to [override the default behavior](#override-default-behavior).

### `options.customize`

Optional. Use it to [define custom coercion](#define-custom-coercion) for a specific schema.

## Example

```ts
import { coerceFormValue } from '@conform-to/zod/v3/future'; // Or import `@conform-to/zod/v4/future`.
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
  const { form, fields } = useForm({
    schema,
  });

  // ...
}
```

## Tips

### Override default behavior

You can override the default coercion by specifying the `defaultCoercion` mapping in the options.

```ts
const schema = coerceFormValue(
  z.object({
    // ...
  }),
  {
    defaultCoercion: {
      // Trim the value for all string-based fields
      // e.g. `z.string()`, `z.number()` or `z.boolean()`
      string: (value) => {
        if (typeof value !== 'string') {
          return value;
        }

        const result = value.trim();

        // Treat it as `undefined` if the value is empty
        if (result === '') {
          return undefined;
        }

        return result;
      },

      // Override the default coercion with `z.number()`
      number: (value) => {
        // Pass the value as is if it's not a string
        if (typeof value !== 'string') {
          return value;
        }

        // Trim and remove commas before casting it to number
        return Number(value.trim().replace(/,/g, ''));
      },

      // Disable coercion for `z.boolean()`
      boolean: false,
    },
  },
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

### Define custom coercion

You can customize coercion for a specific schema by setting the `customize` option.

```ts
import { coerceFormValue } from '@conform-to/zod/v3/future'; // Or import `@conform-to/zod/v4/future`.
import { z } from 'zod';

const metadata = z.object({
  number: z.number(),
  confirmed: z.boolean(),
});

const schema = coerceFormValue(
  z.object({
    ref: z.string(),
    metadata,
  }),
  {
    customize(type) {
      // Customize how the `metadata` schema is coerced
      if (type === metadata) {
        return (value) => {
          if (typeof value !== 'string') {
            return value;
          }

          // Parse the value as JSON
          return JSON.parse(value);
        };
      }

      // Return `null` to keep the default behavior
      return null;
    },
  },
);
```
