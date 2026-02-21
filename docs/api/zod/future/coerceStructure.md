# coerceStructure

> The `coerceStructure` function is part of Conform's future export. These APIs are experimental and may change in minor versions. [Learn more](https://github.com/edmundhung/conform/discussions/954)

Enhances a schema to convert form string values to their typed equivalents without running validation. Useful for reading current form values as typed data. To customize the coercion behavior, use [`configureCoercion`](./configureCoercion.md).

```ts
import { coerceStructure } from '@conform-to/zod/v3/future'; // Or '@conform-to/zod/v4/future'

const structuralSchema = coerceStructure(schema);
```

Unlike [`coerceFormValue`](./coerceFormValue.md), this function:

- **Skips validation**: constraints like `min()`, `max()`, `regex()`, `refine()`, etc. are ignored
- **Skips defaults**: `.default()` and `.prefault()` wrappers are bypassed
- **Skips transforms**: `.transform()` and `.preprocess()` are bypassed
- **Preserves empty strings**: they are not stripped to `undefined`

Type coercion still applies: strings are converted to numbers, booleans, dates, and bigints based on the schema type. If conversion fails, a type-appropriate sentinel value is returned (e.g. `NaN` for number, `false` for boolean, `Invalid Date` for date, `0n` for bigint).

## Parameters

### `schema`

The zod schema to use for structural coercion.

## Example

```ts
import { coerceStructure, coerceFormValue } from '@conform-to/zod/v3/future'; // Or '@conform-to/zod/v4/future'
import { useForm, useFormData } from '@conform-to/react/future';
import { z } from 'zod';

const schema = z.object({
  name: z.string(),
  age: z.number().min(0).max(120),
  subscribe: z.boolean(),
});

function Example() {
  const { form, fields } = useForm({
    schema: coerceFormValue(schema),
  });

  // Read typed form values without validation
  const value = useFormData(form.id, (formData) => {
    const submission = parseSubmission(formData);
    return coerceStructure(schema).parse(submission.payload);
  });

  // value.age is a number (or NaN if conversion failed)
  // value.subscribe is a boolean
  // value.name is a string (empty string preserved, not undefined)

  // ...
}
```
