# Integrations

Integrating a form validation library with form controls are cumbersome, especially when working with an existing design system. Progressively enhanced form control.

## Native form controls

By utilizing event delegation, Conform support native form controls out of the box, which includes `<input />`, `<select />` and `<textarea />`.

```tsx
function Example() {
    const [form, { title, description, color }] = useForm();

    return (
        <form {...form.props}>
            <div>
                <label>Title</label>
                <input type="text" name="title" />
                <div>{title.error}
            </div>
            <div>
                <label>Description</label>
                <textarea name="description" />
                <div>{description.error}
            </div>
            <div>
                <label>Color</label>
                <select name="color">
                    <option>Red</option>
                    <option>Green</option>
                    <option>Blue</option>
                </select>
                <div>{color.error}</div>
            </div>
            <button>Submit</button>
        </form>
    )
}
```

## Custom input component

```tsx
import { useForm, useControlledInput } from '@conform-to/react';
import Select from 'react-select';

function Example() {
  const [form, { currency }] = useForm();
  const [shadowInputProps, control] = useControlledInput(config);

  return (
    <form {...form.props}>
      <div>
        <label>Currency</label>
        <input {...shadowInputProps} />
        <Select
          ref={control.ref}
          value={control.value}
          onChange={control.onChange}
          onBlur={control.onBlur}
        />
        <div>{currency.error}</div>
      </div>
      <button>Submit</button>
    </form>
  );
}
```

Here are some examples:

- [Chakra UI](../examples/chakra-ui)
- [Headless UI](../examples/headless-ui)
- [Material UI](../examples/material-ui)
