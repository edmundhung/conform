# useField

> The `useField` function is part of Conform's future export. These APIs are experimental and may change in minor versions. [Learn more](https://github.com/edmundhung/conform/discussions/954)

A React hook that provides access to a specific field's metadata and state from any component within a `FormProvider` context.

```ts
import { useField } from '@conform-to/react/future';

const field = useField(name, options);
```

## Parameters

### `name: FieldName<FieldShape>`

The name of the input field.

### `options.formId?: string`

Optional form identifier to target a specific form when multiple forms are rendered. If not provided, uses the nearest form context.

## Returns

A `Field` object containing field metadata and state:

### `id: string`

The field's unique identifier, automatically generated as `{formId}-{fieldName}`.

### `name: FieldName<FieldShape>`

The field name path exactly as provided. The FieldName type is just a branded string type to help with TypeScript inference.

### `descriptionId: string`

Auto-generated ID for associating field descriptions via `aria-describedby`.

### `errorId: string`

Auto-generated ID for associating field errors via `aria-describedby`.

### `defaultValue: string | undefined`

The field's default value as a string.

### `defaultOptions: string[] | undefined`

Default selected options for multi-select fields or checkbox group.

### `defaultChecked: boolean | undefined`

Default checked state for checkbox/radio inputs.

### `touched: boolean`

Whether this field has been touched (through `intent.validate()` or the `shouldValidate` option).

### `invalid: boolean`

Whether this field currently has validation errors.

### `errors: ErrorShape[] | undefined`

Array of validation error messages for this field.

### Validation Attributes

HTML validation attributes automatically derived from schema constraints:

- `required?: boolean`
- `minLength?: number`
- `maxLength?: number`
- `pattern?: string`
- `min?: string | number`
- `max?: string | number`
- `step?: string | number`
- `multiple?: boolean`

### `getFieldset(): Fieldset<FieldShape>`

Method to get nested fieldset for object fields under this field.

### `getFieldList(): Field[]`

Method to get array of fields for list/array fields under this field.

## Example

### Dynamic field components

```tsx
import { useField } from '@conform-to/react/future';

interface FieldProps {
  name: string;
  label: string;
  type?: string;
}

function FormField({ name, label, type = 'text' }: FieldProps) {
  const field = useField(name);

  return (
    <div className={`form-field ${field.invalid ? 'invalid' : ''}`}>
      <label htmlFor={field.id}>
        {label}
        {field.required && <span className="required">*</span>}
      </label>

      <input
        id={field.id}
        name={field.name}
        type={type}
        defaultValue={field.defaultValue}
        required={field.required}
        minLength={field.minLength}
        maxLength={field.maxLength}
        pattern={field.pattern}
        min={field.min}
        max={field.max}
        step={field.step}
        aria-describedby={field.errors ? field.errorId : undefined}
      />

      {field.errors && (
        <div id={field.errorId} className="field-errors">
          {field.errors.map((error, i) => (
            <p key={i} className="error-message">
              {error}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

// Usage
function MyForm() {
  const { form, context } = useForm({
    // ...
  });

  return (
    <FormProvider context={form.context}>
      <form {...form.props}>
        <FormField name="firstName" label="First Name" />
        <FormField name="email" label="Email" type="email" />
        <FormField name="age" label="Age" type="number" />
      </form>
    </FormProvider>
  );
}
```

### Nested field access

```tsx
import { useField } from '@conform-to/react/future';

function AddressFields({ name }: { name: string }) {
  const field = useField(name);
  const address = field.getFieldset();

  return (
    <fieldset>
      <legend>Address</legend>

      <div>
        <label htmlFor={address.street.id}>Street Address</label>
        <input
          id={address.street.id}
          name={address.street.name}
          defaultValue={address.street.defaultValue}
          required={address.street.required}
        />
        {address.street.errors && (
          <div className="error">{address.street.errors.join(', ')}</div>
        )}
      </div>

      <div>
        <label htmlFor={address.city.id}>City</label>
        <input
          id={address.city.id}
          name={address.city.name}
          defaultValue={address.city.defaultValue}
          required={address.city.required}
        />
        {address.city.errors && (
          <div className="error">{address.city.errors.join(', ')}</div>
        )}
      </div>

      <div>
        <label htmlFor={address.zip.id}>ZIP Code</label>
        <input
          id={address.zip.id}
          name={address.zip.name}
          defaultValue={address.zip.defaultValue}
          pattern={address.zip.pattern}
          required={address.zip.required}
        />
        {address.zip.errors && (
          <div className="error">{address.zip.errors.join(', ')}</div>
        )}
      </div>
    </fieldset>
  );
}
```

### Array field handling

```tsx
import { useField } from '@conform-to/react/future';

function TagInput({ name }: { name: string }) {
  const field = useField(name);
  const tagFields = field.getFieldList();

  return (
    <div>
      <label>Tags</label>
      {tagFields.map((tagField) => (
        <div key={tagField.key}>
          <input name={tagField.name} defaultValue={tagField.defaultValue} />
          {tagField.errors && (
            <span className="error">{tagField.errors.join(', ')}</span>
          )}
        </div>
      ))}
    </div>
  );
}
```

## Tips

### Accessibility

The hook provides auto-generated IDs for proper ARIA associations:

- Use `id` for the input element and `htmlFor` on the label
- Use `descriptionId` for help text (`aria-describedby`)
- Use `errorId` for error messages (`aria-describedby`)
