---
'@conform-to/react': minor
'@conform-to/zod': minor
'@conform-to/valibot': minor
---

## New `useForm` overload for schema-first forms

You can now pass a schema directly as the first argument to `useForm`, with options as the second argument:

```tsx
const { form, fields } = useForm(schema, {
  onSubmit(event, { value }) {
    // value is fully typed based on your schema
  },
});
```

**Breaking changes:**

- The manual (non-schema) setup `useForm({ onValidate, ... })` no longer accepts a `schema` option. Use the schema-first API `useForm(schema, options)` instead.
- The options parameter now requires at least `lastResult` or `onSubmit` to be provided.

## New `getConstraint` option for `FormOptionsProvider`

Automatically derive HTML validation attributes from your schema. Set this once globally and you no longer need to configure the `constraint` option on every `useForm`:

```tsx
import { getZodConstraint } from '@conform-to/zod/v3/future';

<FormOptionsProvider getConstraint={getZodConstraint}>
  <App />
</FormOptionsProvider>;
```

This automatically derives HTML attributes like `required`, `minLength`, `maxLength`, `min`, `max`, `pattern`, etc. from your schema for all forms.

## New `validateSchema` option for `FormOptionsProvider`

Customize how schemas are validated globally across your application. This is useful for advanced scenarios like custom error maps or non-StandardSchema libraries.

To enable type inference with `validateSchema`, declare the `CustomSchema` interface for your schema library:

```tsx
// 1. Declare CustomSchema for type inference
declare module '@conform-to/react/future' {
  interface CustomSchema<Schema> {
    baseType: z.ZodTypeAny;
    input: Schema extends z.ZodTypeAny ? z.input<Schema> : unknown;
    output: Schema extends z.ZodTypeAny ? z.output<Schema> : unknown;
    options: Partial<z.ParseParams>;
  }
}

// 2. Configure FormOptionsProvider with validateSchema options
<FormOptionsProvider
  validateSchema={(schema, { payload, schemaOptions }) => {
    try {
      const result = schema.safeParse(payload, schemaOptions);
      return formatResult(result);
    } catch {
      return schema.safeParseAsync(payload, schemaOptions).then(formatResult);
    }
  }}
>
  <App />
</FormOptionsProvider>;

// 3. Setup your form with a schema
function SignupForm() {
  const schema = z.object({
    username: z.string().min(3),
    email: z.string().email(),
  });

  const { form, fields } = useForm(schema, {
    schemaOptions: { errorMap: customErrorMap }, // Optional per-form customization
    onSubmit(event, { value }) {
      console.log(value); // Fully typed: { username: string; email: string }
    },
  });

  return <form {...form.props}>...</form>;
}
```
