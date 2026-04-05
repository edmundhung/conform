# useForm

> The `useForm` function is part of Conform's future export. These APIs are experimental and may change in minor versions. [Learn more](https://github.com/edmundhung/conform/discussions/954)

The main React hook for Conform. It manages validation state (errors, touched, valid) that updates on events like submit or blur, not on every keystroke. This keeps re-renders minimal.

```ts
import { useForm } from '@conform-to/react/future';

const manual = useForm(options);
const withSchema = useForm(schema, options);
```

## Schema

Pass a [standard schema](https://standardschema.dev/) as the first argument with `useForm(schema, options)` to enable schema validation and schema-derived type inference.

When a schema is provided:

- Conform runs schema validation before `onValidate`
- `onValidate` can still add or replace validation errors
- `ctx.schemaValue` contains the parsed schema value when validation succeeds
- `schemaOptions` is forwarded to the configured schema validator

The exported `useForm` function accepts Standard Schema compatible libraries. Use [configureForms](./configureForms.md) to support other schema types.

Use `useForm(options)` when you want manual validation only.

## Options

A configuration object with the following properties:

### `id?: string`

Optional form identifier. If not provided, a unique ID is automatically generated with [useId()](https://react.dev/reference/react/useId).

### `key?: string`

Optional key for form state reset. When the key changes, the form resets to its initial state.

### `defaultValue?: DefaultValue<FormShape>`

Initial form values. Can be a partial object matching your form structure.

### `serialize?: (value, ctx) => FormValue | null | undefined`

A custom serialization function for converting form values.

- `ctx.name` is the field name being serialized when available.
- `ctx.defaultSerialize(value)` lets you delegate values you are not customizing to the resolved default serializer.

The default serializer can be configured via [configureForms](./configureForms.md).

### `constraint?: Record<string, ValidationAttributes>`

HTML validation attributes for fields (`required`, `minLength`, `pattern`, etc.).

### `schemaOptions?: InferOptions<Schema>`

Options forwarded to the configured schema validator when using `useForm(schema, options)`.

The exact shape depends on the schema integration configured through [configureForms](./configureForms.md).

### `shouldValidate?: 'onSubmit' | 'onBlur' | 'onInput'`

When to start validation. Defaults to `'onSubmit'`.

### `shouldRevalidate?: 'onSubmit' | 'onBlur' | 'onInput'`

When to revalidate fields that have been touched. Defaults to same as `shouldValidate`.

### `lastResult?: SubmissionResult<ErrorShape> | null`

Server-side submission result for form state synchronization.

### `onValidate?: ValidateHandler<ErrorShape, Value>`

Custom validation handler. Can be skipped when a schema is passed as the first argument, or combined with schema validation to customize validation errors.

### `onError?: ErrorHandler<ErrorShape>`

Error handling callback triggered when validation errors occur. By default, it focuses the first invalid field.

### `onSubmit?: SubmitHandler<ErrorShape, Value>`

Form submission handler called when the form is submitted with no validation errors.

### `onInput?: InputHandler`

Input event handler for custom input event logic.

### `onBlur?: BlurHandler`

Blur event handler for custom focus handling logic.

## Returns

The hook returns an object with three properties:

### `form: FormMetadata<ErrorShape>`

Form-level metadata and state. See [`useFormMetadata`](./useFormMetadata.md) for complete documentation.

### `fields: Fieldset<FormShape>`

Fieldset object containing all form fields as properties. Equivalent to calling `form.getFieldset()` without a name. Access field metadata via `fields.fieldName`. See [`useField`](./useField.md) for field metadata documentation.

### `intent: IntentDispatcher`

Intent dispatcher for programmatic form actions. Same functionality as [`useIntent`](./useIntent.md) but already connected to this form.

## Examples

### Basic form setup

```tsx
import { useForm } from '@conform-to/react/future';

function ContactForm() {
  const { form, fields } = useForm({
    onValidate({ payload, error }) {
      if (!payload.email) {
        error.fieldErrors.email = ['Email is required'];
      } else if (!payload.email.includes('@')) {
        error.fieldErrors.email = ['Email is invalid'];
      }

      return error;
    },
  });

  return (
    <form {...form.props}>
      <div>
        <label htmlFor={fields.email.id}>Email</label>
        <input
          type="email"
          id={fields.email.id}
          name={fields.email.name}
          defaultValue={fields.email.defaultValue}
        />
        <div>{fields.email.errors}</div>
      </div>
      <button type="submit">Submit</button>
    </form>
  );
}
```

### With schema validation

```tsx
import { useForm } from '@conform-to/react/future';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email('Email is invalid'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

function LoginForm() {
  const { form, fields } = useForm(schema, {
    shouldValidate: 'onBlur',
  });

  return (
    <form {...form.props}>
      <input
        type="email"
        name={fields.email.name}
        defaultValue={fields.email.defaultValue}
      />
      <div>{fields.email.errors}</div>
      <input
        type="password"
        name={fields.password.name}
        defaultValue={fields.password.defaultValue}
      />
      <div>{fields.password.errors}</div>

      <button type="submit" disabled={!form.valid}>
        Login
      </button>
    </form>
  );
}
```

### Using intent dispatcher

```tsx
import { useForm } from '@conform-to/react/future';

function DynamicForm() {
  const { form, fields, intent } = useForm({
    defaultValue: {
      items: ['First item'],
    },
  });
  const items = fields.items.getFieldList();

  return (
    <form {...form.props}>
      {items.map((item, index) => (
        <div key={item.key}>
          <label htmlFor={item.id}>Item {index + 1}</label>
          <input
            id={item.id}
            name={item.name}
            defaultValue={item.defaultValue}
          />
          <div>{item.errors}</div>

          <button
            type="button"
            onClick={() => intent.remove({ name: 'items', index })}
          >
            Remove
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={() => intent.insert({ name: 'items', defaultValue: '' })}
      >
        Add Item
      </button>

      <button>Submit</button>
    </form>
  );
}
```

## Tips

### Field access patterns

Choose the appropriate pattern based on your needs:

- **Static fields**: Use `fields.fieldName` directly
- **Dynamic field**: Use `form.getField(name)`, `form.getFieldset(name)` or `form.getFieldList(name)` to access fields by name
- **Field components**: Use [`useField`](./useField.md) or [`useFormMetadata`](./useFormMetadata.md) in child components
