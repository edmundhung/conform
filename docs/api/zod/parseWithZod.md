# parseWithZod

A helper that returns an overview of the submission by parsing the form data with the provided zod schema.

```tsx
const submission = parseWithZod(payload, options);
```

## Parameters

### `payload`

It could be either the **FormData** or **URLSearchParams** object depending on how the form is submitted.

### `options.schema`

Either a zod schema or a function that returns a zod schema.

### `options.async`

Set it to **true** if you want to parse the form data with **safeParseAsync** method from the zod schema instead of **safeParse**.

### `options.errorMap`

A zod [error map](https://github.com/colinhacks/zod/blob/master/ERROR_HANDLING.md#contextual-error-map) to be used when parsing the form data.

### `options.formatError`

A function that let you customize the error structure and include additional metadata as needed.

### `options.disableAutoCoercion`

Set it to **true** if you want to disable [automatic type coercion](#automatic-type-coercion) and manage how the form data is parsed yourself.

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

By default, `parseWithZod` will strip empty value and coerce form value to the correct type by introspecting the schema and inject extra preprocessing steps using the [coerceFormValue](./coerceFormValue) helper internally.

If you want to customize this behavior, you can disable automatic type coercion by setting `options.disableAutoCoercion` to `true` and manage it yourself.

```tsx
import { parseWithZod } from '@conform-to/zod';
import { useForm } from '@conform-to/react';
import { z } from 'zod';

const schema = z.object({
  // Strip empty value and coerce the number yourself
  amount: z.preprocess((value) => {
    if (typeof value !== 'string') {
      return value;
    }

    if (value === '') {
      return undefined;
    }

    return Number(value.trim().replace(/,/g, ''));
  }, z.number()),
});

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
