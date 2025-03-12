# unstable_coerceFormValue

A helper that enhances the schema with extra preprocessing steps to strip empty value and coerce form value to the expected type.

```ts
const enhancedSchema = coerceFormValue(schema, options);
```

以下のルールが適用されます:

1. 値が空の文字列 / ファイルである場合、スキーマに `undefined` を渡します。
2. スキーマが `z.number()` の場合、値をトリムして `Number` コンストラクタでキャストします。
3. スキーマが `z.boolean()` の場合、値が `on` に等しい場合には `true` として扱います。
4. スキーマが `z.date()` の場合、値を `Date` コンストラクタでキャストします。
5. スキーマが `z.bigint()` の場合、値を `BigInt` コンストラクタでキャストします。

## Parameters

### `schema`

The zod schema to be enhanced.

### `options.defaultCoercion`

Optional. Set it if you want to [override the default behavior](#override-default-behavior).

### `options.defineCoercion`

Optional. Use it to [define custom coercion](#define-custom-coercion) for a specific schema.

## Example

```ts
import { parseWithZod, unstable_coerceFormValue as coerceFormValue } from '@conform-to/zod';
import { useForm } from '@conform-to/react';
import { z } from 'zod';
import { jsonSchema } from './jsonSchema';

const schema = coerceFormValue(
  z.object({
    ref: z.string()
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
        defaultTypeCoercion: false,
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
  z.object({
    // ...
  }),
  {
    defaultCoercion: {
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

### デフォルト値

Conform は常に空の文字列を削除し、それらを「undefined」にします。 `.transform()` をスキーマに追加して、代わりに返されるデフォルト値を定義します。

```tsx
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

You can define custom coercion for a specific schema by setting the `defineCoercion` option.

```ts
import {
  parseWithZod,
  unstable_coerceFormValue as coerceFormValue,
} from '@conform-to/zod';
import { useForm } from '@conform-to/react';
import { z } from 'zod';
import { json } from './schema';

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
    defineCoercion(type) {
      // Customize how the `metadata` field value is coerced
      if (type === metadata) {
        return (value) => {
          if (typeof value !== 'string') {
            return value;
          }

          // Parse the value as JSON
          return JSON.parse(value);
        };
      }

      return null;
    },
  },
);
```
