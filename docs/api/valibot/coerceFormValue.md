# unstable_coerceFormValue

A helper that enhances the schema with extra preprocessing steps to strip empty value and coerce form value to the expected type.

```ts
const enhancedSchema = coerceFormValue(schema, options);
```

The following rules will be applied by default:

1. If the value is an empty string / file, pass `undefined` to the schema
2. If the schema is `v.number()`, trim the value and cast it with the `Number` constructor
3. If the schema is `v.boolean()`, treat the value as `true` if it equals to `on` (Browser default `value` of a checkbox / radio button)
4. If the schema is `v.date()`, cast the value with the `Date` constructor
5. If the schema is `v.bigint()`, trim the value and cast the value with the `BigInt` constructor

## Parameters

### `schema`

The valibot schema to be enhanced.

### `options.defaultCoercion`

Optional. Set it if you want to [override the default behavior](#override-default-behavior).

### `options.customize`

Optional. Use it to [define custom coercion](#define-custom-coercion) for a specific schema.

## Example

```ts
import { parseWithValibot, unstable_coerceFormValue as coerceFormValue } from '@conform-to/valibot';
import { useForm } from '@conform-to/react';
import { object, string, date, number, boolean } from 'valibot';
import { jsonSchema } from './jsonSchema';

const schema = coerceFormValue(
  object({
    ref: string()
    date: date(),
    amount: number(),
    confirm: boolean(),
  }),
);

function Example() {
  const [form, fields] = useForm({
    onValidate({ formData }) {
      return parseWithValibot(formData, {
        schema,
        disableAutoCoercion: true,
      });
    },
  });

  // ...
}
```

## Tips

### Override default behavior

You can override the default coercion by specifying the `defaultCoercion` mapping in the options.

```ts
const schema = coerceFormValue(
  object({
    // ...
  }),
  {
    defaultCoercion: {
      // Override the default coercion with `number()`
      number: (value) => {
        // Pass the value as is if it's not a string
        if (typeof value !== 'string') {
          return value;
        }

        // Trim and remove commas before casting it to number
        return Number(value.trim().replace(/,/g, ''));
      },

      // Disable coercion for `boolean()`
      boolean: false,
    },
  },
);
```

### Default values

`coerceFormValue` will always strip empty values to `undefined`. If you need a default value, use `optional()` to define a fallback value that will be returned instead.

```ts
const schema = object({
  foo: optional(string()), // string | undefined
  bar: optional(string(), ''), // string
  baz: optional(nullable(optional()), null), // string | null
});
```

### Define custom coercion

You can customize coercion for a specific schema by setting the `customize` option.

```ts
import {
  parseWithValibot,
  unstable_coerceFormValue as coerceFormValue,
} from '@conform-to/valibot';
import { useForm } from '@conform-to/react';
import { object, string, number, boolean } from 'valibot';
import { json } from './schema';

const metadata = object({
  number: number(),
  confirmed: boolean(),
});

const schema = coerceFormValue(
  object({
    ref: string(),
    metadata,
  }),
  {
    customize(schema) {
      // Customize how the `metadata` field value is coerced
      if (schema === metadata) {
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
