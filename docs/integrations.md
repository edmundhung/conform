# Integrations

In this guide, we will show you how Conform can works with different form controls, including custom input components.

<!-- aside -->

## On this page

- [Native form controls](#native-form-controls)
- [Custom input component](#custom-input-component)

<!-- /aside -->

## Native form controls

Conform utilises event delegation and supports native form controls out of the box, which includes `<input />`, `<select />` and `<textarea />`.

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

When integrating with a UI components library, it is important to think about how it is different from a native input. For example, most of these libraries will provide an `<Input />` component which is simply a wrapper on top of native input and they will be supported by Conform out of the box too.

However, for custom input like `<Select />` or `<DatePicker />`, you can make it progressivly enhanced with the [useControlledInput](../packages/conform-react/README.md#usecontrolledinput) hook:

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

- [Chakra UI](/examples/chakra-ui)
- [Headless UI](/examples/headless-ui)
- [Material UI](/examples/material-ui)
