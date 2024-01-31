# parseWithZod

A helper that returns an overview of the submission by parsing the form data with the provided zod schema.

```tsx
const submission = parseWithZod(payload, options);
```

## Parameters

### `payload`

It could be either the **FormData** or **URLSearchParams** object depending on how the form is submitted.

### `options`

#### `schema`

Either a zod schema or a function that returns a zod schema.

#### `async`

Set it to **true** if you want to parse the form data with **safeParseAsync** method from the zod schema instead of **safeParse**.

#### `errorMap`

A zod [error map](https://github.com/colinhacks/zod/blob/master/ERROR_HANDLING.md#contextual-error-map) to be used when parsing the form data.

#### `formatError`

A function that let you customize the error structure and include additional metadata as needed.

## Example

```tsx
import { parseWithZod } from '@conform-to/zod';
import { useForm } from '@conform-to/react';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string(),
});

function Example() {
  const [form, fields] = useForm({
    onValidate({ formData }) {
      return parseWithZod(formData, { schema });
    },
  });

  // ...
}
```

## Tips

### Automatic type coercion

Conform will strip empty value and coerce the form data to the expected type by introspecting the schema and inject an extra preprocessing step. The following rules will be applied:

1. If the value is an empty string / file, pass `undefined` to the schema
2. If the schema is `z.string()`, pass the value as is
3. If the schema is `z.number()`, trim the value and cast it with the `Number` constructor
4. If the schema is `z.boolean()`, treat the value as `true` if it equals to `on`
5. If the schema is `z.date()`, cast the value with the `Date` constructor
6. If the schema is `z.bigint()`, cast the value with the `BigInt` constructor

You can override this behavior by setting up your own `z.preprocess` step in the schema.

> Note: There are several bug reports on Zod's repository regarding the behaviour of `z.preprocess` since v3.22, like https://github.com/colinhacks/zod/issues/2671 and https://github.com/colinhacks/zod/issues/2677. If you are experiencing any issues, please downgrade to v3.21.4.

```tsx
const schema = z.object({
  amount: z.preprocss((value) => {
    // If no value is provided, return `undefined`
    if (!value) {
      return undefined;
    }

    // Clear the formatting and cast the value to number
    return Number(value.trim().replace(/,/g, ''));
  }, z.number()),
});
```

### Default values

Conform already preprocesses empty values to `undefined`. Add `.default()` to your schema to define a default value that will be returned instead.

Zod will return the default value if the input is `undefined` after preprocessing. This also has the effect of changing the schema return type.

```tsx
const schema = z.object({
  foo: z.string(), // string | undefined
  bar: z.string().default('bar'), // string
  baz: z.string().nullable().default(null), // string | null
});
```
