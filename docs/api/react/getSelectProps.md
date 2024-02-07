# getSelectProps

A helper that returns all the props required to make an select element accessible.

```tsx
const props = getSelectProps(meta, options);
```

## Example

```tsx
import { useForm, getSelectProps } from '@conform-to/react';

function Example() {
  const [form, fields] = useForm();

  return <select {...getSelectProps(fields.category)} />;
}
```

## Options

### `value`

The helper will return a **defaultValue** unless this is set to `false`, e.g. a controlled input.

### `ariaAttributes`

Decide whether to include `aria-invalid` and `aria-describedby` in the result props. Default to **true**.

### `ariaInvalid`

Decide whether the aria attributes should be based on `meta.errors` or `meta.allErrors`. Default to **errors**.

### `ariaDescribedBy`

Append additional **id** to the `aria-describedby` attribute. You can pass `meta.descriptionId` from the field metadata.

## Tips

### The helper is optional

The helper is just a convenience function to help reducing boilerplate and make it more readable. You can always use the field metadata directly to set the props of your select element.

```tsx
// Before
function Example() {
  return (
    <form>
      <select
        key={fields.category.key}
        id={fields.category.id}
        name={fields.category.name}
        form={fields.category.formId}
        defaultValue={fields.category.initialValue}
        aria-invalid={!fields.category.valid || undefined}
        aria-describedby={
          !fields.category.valid ? fields.category.errorId : undefined
        }
        required={field.category.required}
        multiple={field.category.multiple}
      />
    </form>
  );
}

// After
function Example() {
  return (
    <form>
      <select {...getSelectProps(fields.category)} />
    </form>
  );
}
```

### Make your own helper

The helper is designed for the native select elements. If you need to use a custom component, you can always make your own helpers.
