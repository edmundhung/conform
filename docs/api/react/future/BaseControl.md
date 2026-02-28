# BaseControl

> The `BaseControl` component is part of Conform's future export. These APIs are experimental and may change in minor versions. [Learn more](https://github.com/edmundhung/conform/discussions/954)

A React component that renders hidden native form controls. It is commonly used with [`useControl`](./useControl) to bridge custom UI components back to standard form submission.

```tsx
import { BaseControl, useControl } from '@conform-to/react/future';

const control = useControl({
  defaultValue: 'initial value',
});

<BaseControl
  name="title"
  ref={control.register}
  defaultValue={control.defaultValue}
/>;
```

## Props

### `name: string`

Name used for the rendered hidden control(s).

### `defaultValue: unknown`

Default value used to render the hidden control(s).

When used with `useControl`, pass `control.defaultValue`.

### `type?: 'text' | 'file' | 'fieldset' | 'select' | 'textarea' | ...`

Controls which hidden element is rendered:

- `fieldset`: renders a hidden `<fieldset>` and recursively renders nested hidden `<input>` elements from `defaultValue`
- `select`: renders a hidden `<select>`
- `textarea`: renders a hidden `<textarea>`
- otherwise: renders a hidden `<input type={type}>`

When omitted, it renders a hidden `<input>`.

### `form?: string`

Form id to associate the hidden control(s) with when rendered outside the `<form>` element.

## Examples

### Hidden text input for simple values

```tsx
const control = useControl({
  defaultValue: field.defaultValue,
});

return (
  <>
    <BaseControl
      name={field.name}
      ref={control.register}
      defaultValue={control.defaultValue}
    />
    <CustomTextInput
      value={control.value ?? ''}
      onChange={(value) => control.change(value)}
      onBlur={() => control.blur()}
    />
  </>
);
```

### Hidden fieldset for structured values

For `type="fieldset"`, object and array shapes are expanded into nested names like `range.start` and `members[0].id`.

`control.defaultValue` drives the hidden inputs that get rendered, while `control.payload` is the current logical value exposed to your custom component.

```tsx
const control = useControl({
  defaultValue: field.defaultPayload,
  parse(payload) {
    return DateRangeSchema.parse(payload);
  },
});

return (
  <>
    <BaseControl
      type="fieldset"
      name={field.name}
      ref={control.register}
      defaultValue={control.defaultValue}
    />
    {/*
      This renders a hidden fieldset with nested inputs:
      
      <fieldset name="range" hidden>
        <input name="range.start" value={control.defaultValue.start} hidden />
        <input name="range.end" value={control.defaultValue.end} hidden />
      </fieldset>

    */}
    <CustomDateRangePicker
      value={control.payload}
      onChange={(value) => control.change(value)}
      onBlur={() => control.blur()}
    />
  </>
);
```
