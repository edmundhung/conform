# useFormMetadata

> The `useFormMetadata` function is part of Conform's future export. These APIs are experimental and may change in minor versions. [Learn more](https://github.com/edmundhung/conform/discussions/954)

A React hook that provides access to form-level metadata and state from any component within a `FormProvider` context.

```ts
import { useFormMetadata } from '@conform-to/react/future';

const form = useFormMetadata(options);
```

## Parameters

### `options.formId?: string`

Optional form identifier to target a specific form when multiple forms are rendered. If not provided, uses the nearest form context.

## Returns

A `FormMetadata` object containing:

### `id: string`

The form's unique identifier.

### `touched: boolean`

Whether any field in the form has been touched (through `intent.validate()` or the `shouldValidate` option).

### `invalid: boolean`

Whether the form currently has any validation errors.

### `errors: ErrorShape[] | undefined`

Form-level validation errors, if any exist.

### `fieldErrors: Record<string, ErrorShape[]>`

Object containing field-specific validation errors for all validated fields.

### `props`

Form props object for spreading onto the `<form>` element:

```ts
{
  id: string;
  onSubmit: React.FormEventHandler<HTMLFormElement>;
  onBlur: React.FocusEventHandler<HTMLFormElement>;
  onInput: React.FormEventHandler<HTMLFormElement>;
  noValidate: boolean;
}
```

### `getField<FieldShape>(name): Field<FieldShape>`

Method to get metadata for a specific field by name.

### `getFieldset<FieldShape>(name): Fieldset<FieldShape>`

Method to get a fieldset object for nested object fields.

### `getFieldList<FieldShape>(name): Field[]`

Method to get an array of field objects for array fields.

## Example

### Global error summary

```tsx
import { useFormMetadata, useForm } from '@conform-to/react/future';

function GlobalErrorSummary() {
  const form = useFormMetadata();

  if (Object.keys(form.fieldErrors).length === 0) {
    return null;
  }

  return (
    <div className="error-summary">
      <h3>Please fix the following errors:</h3>
      <ul>
        {Object.entries(form.fieldErrors).map(([fieldName, errors]) => (
          <li key={fieldName}>
            <strong>{fieldName}:</strong> {errors.join(', ')}
          </li>
        ))}
      </ul>
    </div>
  );
}

function App() {
  const { form, context } = useForm({
    onValidate({ payload, error }) {
      if (!payload.email) {
        error.fieldErrors.email = ['Email is required'];
      }
      if (!payload.password) {
        error.fieldErrors.password = ['Password is required'];
      }
      return error;
    },
  });

  return (
    <FormProvider context={form.context}>
      <form {...form.props}>
        <GlobalErrorSummary />
        <div>
          <label>Email</label>
          <input name="email" type="email" />
        </div>
        <div>
          <label>Password</label>
          <input name="password" type="password" />
        </div>
        <button type="submit">Submit</button>
      </form>
    </FormProvider>
  );
}
```

### Custom form component

```tsx
import { useFormMetadata, useForm } from '@conform-to/react/future';

function CustomForm({ children }: { children: React.ReactNode }) {
  const form = useFormMetadata();

  return (
    <form
      {...form.props}
      className={form.invalid ? 'form-invalid' : 'form-valid'}
    >
      {/* Global form errors */}
      {form.errors && form.errors.length > 0 && (
        <div className="form-errors">
          <h3>Form Error:</h3>
          {form.errors.map((error, i) => (
            <div key={i} className="error-message">
              {error}
            </div>
          ))}
        </div>
      )}

      {children}

      {/* Smart submit button */}
      <button
        type="submit"
        disabled={form.invalid}
        className={form.touched ? 'submit-ready' : 'submit-pending'}
      >
        {form.invalid && form.touched ? 'Fix errors to submit' : 'Submit'}
      </button>
    </form>
  );
}

function App() {
  const { context } = useForm({
    onValidate({ payload, error }) {
      if (!payload.email) error.fieldErrors.email = ['Email is required'];
      if (!payload.name) error.fieldErrors.name = ['Name is required'];
      return error;
    },
  });

  return (
    <FormProvider context={form.context}>
      <CustomForm>
        <div>
          <label>Name</label>
          <input name="name" />
        </div>
        <div>
          <label>Email</label>
          <input name="email" type="email" />
        </div>
      </CustomForm>
    </FormProvider>
  );
}
```
