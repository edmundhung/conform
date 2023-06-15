# Integrations

In this guide, we will show you how Conform can works with different form controls, including custom input components.

<!-- aside -->

## On this page

- [Native form controls](#native-form-controls)
- [Custom input component](#custom-input-component)

<!-- /aside -->

## Native form controls

Native form controls are supported out of the box. There is no need to setup any event handlers on `<input />`, `<select />` or `<textarea />` element, as Conform utilizes event delegation and listens to events on the form level instead.

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

Integrating Conform with a UI components library, however, might requires integration depending on how it is implemented. For example, an `<Input />` component could be just a styled input element. As the user will continue typing on a native input element, there is no additional integration needed.

However, custom control such as `<Select />` or `<DatePicker />` will likely require users to interact with custom elements instead with no focus / input / blur event dispatched from the native form control element. This is where the [useInputEvent](/packages/conform-react/README.md#useinputevent) hook comes in handy.

Here is an example integrating with **react-select**:

```tsx
import { useForm, useInputEvent } from '@conform-to/react';
import Select from 'react-select';

function Example() {
  const [form, { currency }] = useForm();
  const shadowInputRef = useRef<HTMLInputElement>(null);
  const control = useInputEvent({
    ref: shadowInputRef,
  });

  return (
    <form {...form.props}>
      <div>
        <label>Currency</label>
        {/*
          This is a shadow input which will be validated by Conform
        */}
        <input
          ref={shadowInputRef}
          {...conform.input(currency, {
            ariaAttributes: true,
            hidden: true,
          })}
        />
        {/*
          This makes the corresponding events to be dispatched
          from the element that the `shadowInputRef` is assigned to.
        */}
        <Select
          options={
            [
              /*...*/
            ]
          }
          defaultValue={currency.defaultValue ?? ''}
          onChange={control.change}
          onFocus={control.focus}
          onBlur={control.blur}
        />
        <div>{currency.error}</div>
      </div>
      <button>Submit</button>
    </form>
  );
}
```

To reuse the integration across several forms, you can consider creating a wrapper as well:

```tsx
import type { FieldConfig } from '@conform-to/react';
import { useForm, useInputEvent } from '@conform-to/react';
import ReactSelect from 'react-select';

function Example() {
  const [form, { currency }] = useForm();

  return (
    <form {...form.props}>
      <div>
        <label>Currency</label>
        <Select
          options={
            [
              /*...*/
            ]
          }
          {...currency}
        />
        <div>{currency.error}</div>
      </div>
      <button>Submit</button>
    </form>
  );
}

// The `FieldConfig` type includes common attributes
// like id, name, defaultValue, required etc
interface SelectProps extends FieldConfig<string> {
  options: Array<{ label: string; value: string }>;
}

function Select({ options, ...config }: SelectProps) {
  const shadowInputRef = useRef<HTMLInputElement>(null);
  const control = useInputEvent({
    ref: shadowInputRef,
  });

  return (
    <>
      <input
        ref={shadowInputRef}
        {...conform.input(config, {
          ariaAttributes: true,
          hidden: true,
        })}
      />
      <ReactSelect
        options={options}
        defaultValue={config.defaultValue}
        onChange={control.change}
        onFocus={control.focus}
        onBlur={control.blur}
      />
    </>
  );
}
```

If the custom control support manual focus, you can also hook it with the shadow input and let Conform focus on it when there is any error:

```tsx
function Select({ options, ...config }: SelectProps) {
  const shadowInputRef = useRef<HTMLInputElement>(null);
  const control = useInputEvent({
    ref: shadowInputRef,
  });
  // The type of the ref might be different depends on the UI library
  const customInputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      {/*
          Conform will focus on the shadow input which will then be "forwarded"
          to the Select component.
        */}
      <input
        ref={shadowInputRef}
        {...conform.input(config, {
          ariaAttributes: true,
          hidden: true,
        })}
        onFocus={() => customInputRef.current?.focus()}
      />
      <Select
        innerRef={customInputRef}
        options={options}
        defaultValue={config.defaultValue}
        onChange={control.change}
        onBlur={control.blur}
      />
    </>
  );
}
```

The hook also provides support for the **reset** event if needed:

```tsx
function Select({ options, .. }: SelectProps) {
  const [value, setValue] = useState(config.defaultValue ?? '');
  const shadowInputRef = useRef<HTMLInputElement>(null);
  const control = useInputEvent({
    ref: shadowInputRef,
    onReset: () => setValue(config.defaultValue ?? ''),
  });

  return (
    <>
      <input
        ref={shadowInputRef}
        {...conform.input(config, {
          ariaAttributes: true,
          hidden: true,
        })}
        onChange={(e) => setValue(e.target.value)}
      />
      <Select
        options={options}
        value={value}
        onChange={control.change}
        onBlur={control.blur}
      />
    </>
  );
}
```

Here you can find more examples:

- [Chakra UI](/examples/chakra-ui)
- [Headless UI](/examples/headless-ui)
- [Material UI](/examples/material-ui)
