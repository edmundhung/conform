# HiddenInput

> The `HiddenInput` component is part of Conform's future export. These APIs are experimental and may change in minor versions. [Learn more](https://github.com/edmundhung/conform/discussions/954)

A React component that renders hidden native form controls. It is commonly used with [`useControl`](./useControl) to bridge custom UI components back to standard form submission.

```tsx
import { HiddenInput, useControl } from '@conform-to/react/future';

const control = useControl({
  defaultValue: 'initial value',
});

<HiddenInput
  name="title"
  ref={control.register}
  defaultValue={control.defaultPayload}
/>;
```

## Props

### `name: string`

Name used for the rendered hidden control(s).

### `defaultValue: unknown`

Default value used to render the hidden control(s).

`HiddenInput` serializes values as text for hidden controls. For file uploads, use a native file input instead.

### `type?: 'fieldset' | 'select' | 'textarea' | HTMLInputTypeAttribute`

Controls which hidden element is rendered:

- `fieldset`: renders a hidden `<fieldset>` and recursively renders nested hidden `<input>` elements from `defaultValue`
- `select`: renders a hidden `<select>` (uses `multiple` when `defaultValue` is an array)
- `textarea`: renders a hidden `<textarea>`
- otherwise: renders a hidden `<input type={type}>`

When omitted, it renders a hidden `<input>`.

### `form?: string`

Form id to associate the hidden control(s) with when rendered outside the `<form>` element.

## Examples

### Hidden text input

```tsx
const control = useControl({
  defaultValue: field.defaultValue,
});

return (
  <>
    <HiddenInput
      name={field.name}
      ref={control.register}
      defaultValue={control.defaultPayload}
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

```tsx
type DateRange = { start: string; end: string };

const control = useControl<DateRange>({
  defaultPayload: field.defaultPayload,
  parse(payload) {
    return DateRangeSchema.parse(payload);
  },
});

return (
  <>
    <HiddenInput
      type="fieldset"
      name={field.name}
      ref={control.register}
      defaultValue={control.defaultPayload}
    />
    <CustomDateRangePicker
      value={control.payload}
      onChange={(value) => control.change(value)}
      onBlur={() => control.blur()}
    />
  </>
);
```

For `type="fieldset"`, object and array shapes are expanded into nested names like `range.start` and `members[0].id`.
