# getFieldsetProps

A helper that returns all the props required to make a fieldset element accessible.

```tsx
const props = getFieldsetProps(meta, options);
```

## Example

```tsx
import { useForm, getFieldsetProps } from '@conform-to/react';

function Example() {
  const [form, fields] = useForm();

  return <fieldset {...getFieldsetProps(fields.address)} />;
}
```

## Options

### `ariaAttributes`

Decide whether to include `aria-invalid` and `aria-describedby` in the result props. Default to **true**.

### `ariaInvalid`

Decide whether the aria attributes should be based on `field.valid` or `field.allValid`. Default to **field**.

### `ariaDescribedBy`

Append additional **id** to the `aria-describedby` attribute. If the value is **true**, it will use the `descriptionId` from the field metadata.

## Tips

### The helper is optional

The helper is just a convenience function to help reducing boilerplate and make it more readable. You can always use the field metadata directly to set the props of your fieldset element.

```tsx
// Before
function Example() {
  return (
    <fieldset
      id={fields.address.id}
      name={fields.address.name}
      form={fields.address.formId}
      aria-invalid={!form.valid || undefined}
      aria-describedby={!form.valid ? form.errorId : undefined}
    />
  );
}

// After
function Example() {
  return <fieldset {...getFieldsetProps(fields.address)} />;
}
```

### Make your own helper

The helper is designed for the native fieldset elements. If you need to use a custom component, you can always make your own helpers.
