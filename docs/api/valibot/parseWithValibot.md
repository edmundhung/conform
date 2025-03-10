# parseWithValibot

A helper that returns an overview of the submission by parsing the form data with the provided valibot schema.

```tsx
const submission = parseWithValibot(payload, options);
```

## Parameters

### `payload`

It could be either the **FormData** or **URLSearchParams** object depending on how the form is submitted.

### `options.schema`

Either a valibot schema or a function that returns a valibot schema.

### `options.info`

A valibot [parse configuration](<https://github.com/fabian-hiller/valibot/blob/main/website/src/routes/guides/(main-concepts)/parse-data/index.mdx#configuration>) and [select language](<https://github.com/fabian-hiller/valibot/blob/main/website/src/routes/guides/(advanced)/internationalization/index.mdx#select-language>) to be used when parsing the form data.

### `options.disableAutoCoercion`

Set it to **true** if you want to disable [automatic type coercion](#automatic-type-coercion) and manage how the form data is parsed yourself.

## Example

```tsx
import { parseWithValibot } from '@conform-to/valibot';
import { useForm } from '@conform-to/react';
import { pipe, string, email } from 'valibot';

const schema = object({
  email: pipe(string(), email()),
  password: string(),
});

function Example() {
  const [form, fields] = useForm({
    onValidate({ formData }) {
      return parseWithValibot(formData, { schema });
    },
  });

  // ...
}
```

## Tips

### Automatic type coercion

By default, `parseWithValibot` will strip empty value and coerce form value to the correct type by introspecting the schema and inject extra preprocessing steps using the [coerceFormValue](./coerceFormValue) helper internally.

If you want to customize this behavior, you can disable automatic type coercion by setting `options.disableAutoCoercion` to `true` and manage it yourself.

```tsx
import { parseWithValibot } from '@conform-to/valibot';
import { useForm } from '@conform-to/react';
import { pipe, object, transform, unknown, number } from 'valibot';

const schema = object({
  // Strip empty value and coerce the number yourself
  amount: pipe(
    unknown(),
    transform((value) => {
      if (typeof value !== 'string') {
        return value;
      }

      if (value === '') {
        return undefined;
      }

      return Number(value.trim().replace(/,/g, ''));
    }),
    number(),
  ),
});

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
