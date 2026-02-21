# coerceStructure

> The `coerceStructure` function is part of Conform's future export. These APIs are experimental and may change in minor versions. [Learn more](https://github.com/edmundhung/conform/discussions/954)

Enhances a schema to convert form string values to their typed equivalents without running validation. Useful for reading current form values as typed data. To customize the coercion behavior, use [`configureCoercion`](./configureCoercion.md).

```ts
import { coerceStructure } from '@conform-to/valibot/future';

const structuralSchema = coerceStructure(schema);
```

Unlike [`coerceFormValue`](./coerceFormValue.md), this function:

- **Skips validation**: constraints like `minLength()`, `maxLength()`, `regex()`, `check()`, etc. are ignored
- **Skips defaults**: `optional(schema, default)` wrappers are bypassed
- **Skips transforms**: `transform()` pipe actions are bypassed
- **Preserves empty strings**: they are not stripped to `undefined`

Type coercion still applies: strings are converted to numbers, booleans, dates, and bigints based on the schema type. If conversion fails, a type-appropriate sentinel value is returned (e.g. `NaN` for number, `false` for boolean, `Invalid Date` for date, `0n` for bigint).

## Parameters

### `schema`

The valibot schema to use for structural coercion.

## Example

```ts
import { coerceStructure, coerceFormValue } from '@conform-to/valibot/future';
import { useForm, useFormData } from '@conform-to/react/future';
import * as v from 'valibot';

const schema = v.object({
  name: v.string(),
  age: v.pipe(v.number(), v.minValue(0), v.maxValue(120)),
  subscribe: v.boolean(),
});

function Example() {
  const { form, fields } = useForm(coerceFormValue(schema), {
    // ...
  });

  // Read typed form values without validation
  const value = useFormData(form.id, (formData) => {
    const submission = parseSubmission(formData);
    return v.parse(coerceStructure(schema), submission.payload);
  });

  // value.age is a number (or NaN if conversion failed)
  // value.subscribe is a boolean
  // value.name is a string (empty string preserved, not undefined)

  // ...
}
```
