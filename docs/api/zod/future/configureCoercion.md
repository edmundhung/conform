# configureCoercion

> The `configureCoercion` function is part of Conform's future export. These APIs are experimental and may change in minor versions. [Learn more](https://github.com/edmundhung/conform/discussions/954)

A factory that creates [`coerceFormValue`](./coerceFormValue.md) and [`coerceStructure`](./coerceStructure.md) with custom coercion behavior. The default exports of `coerceFormValue` and `coerceStructure` are equivalent to calling `configureCoercion()` with no arguments.

```ts
import { configureCoercion } from '@conform-to/zod/v3/future'; // Or '@conform-to/zod/v4/future'

const { coerceFormValue, coerceStructure } = configureCoercion(config);
```

## Parameters

### `config.stripEmptyString`

Optional. Determines what string values are considered "empty" and stripped to `undefined` during validation. Receives a raw string and returns the string (possibly transformed) or `undefined` to indicate empty.

This only applies to `coerceFormValue`. `coerceStructure` always preserves empty strings. Empty files are always stripped regardless of this setting.

```ts
// Default behavior
stripEmptyString: (value) => (value === '' ? undefined : value);

// Trim whitespace and treat whitespace-only as empty
stripEmptyString: (value) => {
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
};
```

### `config.type`

```ts
type?: {
  number?: (text: string) => number,
  boolean?: (text: string) => boolean,
  date?: (text: string) => Date,
}
```

Optional. Type-specific string-to-typed-value conversion functions shared between validation and structural modes. Each function takes a string and returns the converted value.

- `number`: default uses `Number()` with empty-string guard (returns `NaN` for empty)
- `boolean`: default returns `true` for `'on'`, rejects otherwise
- `date`: default uses `new Date()` with invalid date check

`bigint` is not configurable here because it has no NaN-like sentinel for structural mode. Use `customize` for custom bigint coercion.

### `config.customize`

```ts
customize?: (type: ZodType) => ((value: unknown) => unknown) | null;
```

Optional. A per-schema escape hatch. Called for every schema encountered during traversal. Return a coercion function to override the default for that schema, or `null` to use the default.

The coercion function receives the raw form value directly. This could be a `string`, `File`, an array of values for repeated fields, or any other value depending on the schema structure. Empty values are not stripped automatically.

## Returns

An object with two functions:

- **`coerceFormValue(schema)`**: enhances the schema with empty-value stripping and type coercion for validation.
- **`coerceStructure(schema)`**: enhances the schema with type coercion only (no validation, no stripping) for reading typed form data.

## Examples

### Custom number parsing

Strip commas and handle locale-specific formatting:

```ts
import { configureCoercion } from '@conform-to/zod/v3/future'; // Or '@conform-to/zod/v4/future'
import { z } from 'zod';

const { coerceFormValue, coerceStructure } = configureCoercion({
  type: {
    number: (text) => Number(text.trim().replace(/,/g, '')),
  },
});

const schema = z.object({
  price: z.number().min(0),
});

const validationSchema = coerceFormValue(schema);
const structuralSchema = coerceStructure(schema);
```

### Trimming whitespace

Trim all string values and treat whitespace-only strings as empty:

```ts
const { coerceFormValue } = configureCoercion({
  stripEmptyString: (value) => {
    const trimmed = value.trim();
    return trimmed === '' ? undefined : trimmed;
  },
});
```

### Per-schema coercion with customize

Override coercion for a specific schema, e.g. parsing a JSON-encoded field:

```ts
import { configureCoercion } from '@conform-to/zod/v3/future'; // Or '@conform-to/zod/v4/future'
import { z } from 'zod';

const metadata = z.object({
  tags: z.array(z.string()),
  priority: z.number(),
});

const { coerceFormValue } = configureCoercion({
  customize(type) {
    if (type === metadata) {
      return (value) => {
        if (typeof value !== 'string') {
          throw new Error('Expected a string value for metadata');
        }

        return JSON.parse(value);
      };
    }

    return null;
  },
});

const schema = coerceFormValue(
  z.object({
    title: z.string(),
    metadata,
  }),
);
```
