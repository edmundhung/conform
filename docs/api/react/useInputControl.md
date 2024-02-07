# useInputControl

A React hook that let you control the browser events to be dispatched. It is useful if you want to hook up a custom input to Conform.

```tsx
const control = useInputControl(metaOrOptions);
```

## Example

```tsx
import { useForm, useInputControl } from '@conform-to/react';
import { Select, Option } from './custom-ui';

function Example() {
  const [form, fields] = useForm();
  const color = useInputControl(fields.color);

  return (
    <Select
      name={field.color.name}
      value={color.value}
      onChange={color.change}
      onFocus={color.focus}
      onBlur={color.blur}
    >
      <Option value="red">Red</Option>
      <Option value="green">Green</Option>
      <Option value="blue">Blue</Option>
    </Select>
  );
}
```

## Parameters

### `metaOrOptions`

The field metadata or an options object that includes `key`, `name`, `formId` and `initialValue`.

## Returns

The input control. This gives you access to both the input value and three different event dispatchers.

### `value`

The value on the input. This can be used to set up a controlled input.

### `change(value: string)`

A method to be called when the value should be changed. This will dispatch both the [change](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/change_event) and [input](https://developer.mozilla.org/en-US/docs/Web/API/Element/input_event) event on behalf of the input with the new value.

### `blur()`

A method to be called when the user leaves the input. This will dispatch both the [blur](https://developer.mozilla.org/en-US/docs/Web/API/Element/blur_event) and [focusout](https://developer.mozilla.org/en-US/docs/Web/API/Element/focusout_event) event on behalf of the input.

### `focus()`

A method to be called when . This will dispatch both the [focus](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus) and [focusin](https://developer.mozilla.org/en-US/docs/Web/API/Element/focusin_event) event on behalf of the input.

## Tips

### Focus delegation

Conform will focus on the first invalid input element if submission failed. However, this might not work if your have a custom input. To fix this, you can forward the focus from the input element by listening to the focus event and trigger `element.focus()` on the desired element.

```tsx
import { useForm, useInputControl } from '@conform-to/react';
import { Select, Option } from './custom-ui';

function Example() {
  const [form, fields] = useForm();
  const inputRef = useRef(null);
  const color = useInputControl(fields.color);

  return (
    <>
        <input
            name={fields.color.name}
            defaultValue={fields.color.initialValue}
            className="sr-only"
            tabIndex={-1}
            onFocus={() => inputRef.current?.focus()}
        />
        <Select
            ref={inputRef}
            value={color.value}
            onChange={color.change}
            onFocus={color.focus}
            onBlur={color.blur}
        >
            <Option value="red">Red</Option>
            <Option value="green">Green</Option>
            <Option value="blue">Blue</Option>
        </Select>
    <>
  );
}
```

In the example above, we set up a hidden input manually instead of passing a `name` prop to the custom select component due to no control over the inner input rendered by the custom input. The input is visually hidden but still focusable thanks to the **sr-only** class from [tailwindcss](https://tailwindcss.com/docs/screen-readers#screen-reader-only-elements). When the input is focused, we delegate the focus to the custom input by calling `inputRef.current?.focus()`.

If you are not using tailwindcss, please look for a similar utility from your preferred styling solution or you can apply the following style based on the implementation of the **sr-only** class:

```tsx
const style = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0,0,0,0)',
  whiteSpace: 'nowrap',
  border: 0,
};
```
