# getTextareaProps

A helper that returns all the props required to make an textarea element accessible.

```tsx
const props = getTextareaProps(meta, options);
```

## Example

```tsx
import { useForm, getTextareaProps } from '@conform-to/react';

function Example() {
  const [form, fields] = useForm();

  return <textarea {...getTextareaProps(fields.content)} />;
}
```

## Options

### `value`

The helper will retrun a **defaultValue** unless this is set to `false`, e.g. a controlled input.

### `ariaAttributes`

Decide whether to include `aria-invalid` and `aria-describedby` in the result props. Default to **true**.

### `ariaInvalid`

Decide whether the aria attributes should be based on `meta.errors` or `meta.allErrors`. Default to **errors**.

### `ariaDescribedBy`

Append additional **id** to the `aria-describedby` attribute. You can pass `meta.descriptionId` from the field metadata.

## Tips

### The helper is optional

The helper is just a convenience function to help reducing boilerplate and make it more readable. You can always use the field metadata directly to set the props of your textarea element.

```tsx
// Before
function Example() {
  return (
    <form>
      <textarea
        key={fields.content.key}
        id={fields.content.id}
        name={fields.content.name}
        form={fields.content.formId}
        defaultValue={fields.content.initialValue}
        aria-invalid={!fields.content.valid || undefined}
        aria-describedby={
          !fields.content.valid ? fields.content.errorId : undefined
        }
        required={field.content.required}
        minLength={field.content.minLength}
        maxLength={field.content.maxLength}
      />
    </form>
  );
}

// After
function Example() {
  return (
    <form>
      <textarea {...getTextareaProps(fields.content)} />
    </form>
  );
}
```

### Make your own helper

The helper is designed for the native textarea elements. If you need to use a custom component, you can always make your own helpers.
