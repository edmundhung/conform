# getInputProps

A helper that returns all the props required to make an input element accessible.

```tsx
const props = getInputProps(meta, options);
```

## Example

```tsx
import { useForm, getInputProps } from '@conform-to/react';

function Example() {
  const [form, fields] = useForm();

  return <input {...getInputProps(fields.password, { type: 'password' })} />;
}
```

## Options

### `type`

The type of the input. This is used to determine whether a **defaultValue** or **defaultChecked** state is needed.

### `value`

This is mainly to set the value of the input if the type is `checkbox` or `radio`. But it can also be set to `false` if you want to skip setting the **defaultValue** or **defaultChecked** state, e.g. a controlled input.

### `ariaAttributes`

Decide whether to include `aria-invalid` and `aria-describedby` in the result props. Default to **true**.

### `ariaInvalid`

Decide whether the aria attributes should be based on `meta.errors` or `meta.allErrors`. Default to **errors**.

### `ariaDescribedBy`

Append additional **id** to the `aria-describedby` attribute. You can pass `meta.descriptionId` from the field metadata.

## Tips

### The helper is optional

The helper is just a convenience function to help reducing boilerplate and make it more readable. You can always use the field metadata directly to set the props of your input element.

```tsx
// Before
function Example() {
  return (
    <form>
      {/* text input */}
      <input
        key={fields.task.key}
        id={fields.task.id}
        name={fields.task.name}
        form={fields.task.formId}
        defaultValue={fields.task.initialValue}
        aria-invalid={!fields.task.valid || undefined}
        aria-describedby={!fields.task.valid ? fields.task.errorId : undefined}
        required={field.task.constraint?.required}
        minLength={field.task.constraint?.minLength}
        maxLength={field.task.constraint?.maxLength}
        min={field.task.constraint?.min}
        max={field.task.constraint?.max}
        step={field.task.constraint?.step}
        pattern={field.task.constraint?.pattern}
        multiple={field.task.constraint?.multiple}
      />
      {/* checkbox */}
      <input
        type="checkbox"
        key={fields.completed.key}
        id={fields.completed.id}
        name={fields.completed.name}
        form={fields.completed.formId}
        value="yes"
        defaultChecked={fields.completed.initialValue === 'yes'}
        aria-invalid={!fields.completed.valid || undefined}
        aria-describedby={
          !fields.completed.valid ? fields.completed.errorId : undefined
        }
        required={field.completed.constraint?.required}
      />
    </form>
  );
}

// After
function Example() {
  return (
    <form>
      {/* text input */}
      <input {...getInputProps(fields.task)} />
      {/* checkbox */}
      <input
        {...getInputProps(fields.completed, {
          type: 'checkbox',
          value: 'yes',
        })}
      />
    </form>
  );
}
```

### Make your own helper

The helper is designed for the native input elements. If you need to use a custom component, you can always make your own helpers.
