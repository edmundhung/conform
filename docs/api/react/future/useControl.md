# useControl

> The `useControl` hook is part of Conform's future export. These APIs are experimental and may change in minor versions. [Learn more](https://github.com/edmundhung/conform/discussions/954)

A React hook that syncs custom UI components with Conform by bridging them to a hidden base control. Use it when integrating components like date pickers, rich selects, or toggles from UI libraries.

For details on when you need this hook, see the [UI Libraries Integration Guide](../../../integration/ui-libraries.md).

```ts
import { useControl } from '@conform-to/react/future';

const control = useControl(options);
```

## Options

### `defaultValue?: string | string[] | File | File[] | Shape | null`

Initial value for the control.

```ts
// e.g. Text input
const control = useControl({
  defaultValue: 'my default value',
});

// e.g. Multi-select
const control = useControl({
  defaultValue: ['option-1', 'option-3'],
});

// e.g. Hidden fieldset / structured control
const control = useControl({
  defaultValue: {
    start: '2026-01-01',
    end: '2026-01-07',
  },
  parse(payload) {
    return DateRangeSchema.parse(payload);
  },
});
```

### `defaultChecked?: boolean`

Whether the base control should be checked by default.

```ts
const control = useControl({
  defaultChecked: true,
});
```

### `value?: string`

The submitted value of a checkbox or radio control when checked.

```ts
const control = useControl({
  defaultChecked: true,
  value: 'option-value',
});
```

### `parse?: (payload: unknown) => Shape`

Optional parser for coercing the current payload snapshot into a typed shape.

Use this when the payload needs a stricter shape than the normalized value provides.

```ts
const control = useControl({
  defaultValue: { start: '2026-01-01', end: '2026-01-07' },
  parse(payload) {
    return DateRangeSchema.parse(payload);
  },
});
```

### `serialize?: (value: Shape) => FormValue`

Optional serializer for converting value passed to `change()` back into form values for the base control.

```ts
const control = useControl({
  defaultValue: { start: '2026-01-01', end: '2026-01-07' },
  parse(payload) {
    return {
      start: parseDate(payload.start),
      end: parseDate(payload.end),
    };
  },
  serialize(value) {
    return {
      start: value.start.toString(),
      end: value.end.toString(),
    };
  },
});
```

### `onFocus?: () => void`

A callback function that is triggered when the base control is focused. Use this to delegate focus to a custom input.

```ts
const control = useControl({
  onFocus() {
    controlInputRef.current?.focus();
  },
});
```

## Returns

A control object. This gives you access to the state of the base control with helpers to emulate native form events.

### `value: string | undefined`

Current string value derived from the control payload.

### `options: string[] | undefined`

Current string array derived from the control payload.

### `checked: boolean | undefined`

Checked state derived from the control payload.

### `files: File[] | undefined`

Current file array derived from the control payload.

### `defaultValue: DefaultValue | null | undefined`

Current default value for the base control.

### `payload: Payload | null | undefined`

Current value derived from the registered base control(s).

For native form controls, this often matches the element's `value`. For structural controls, this is reconstructed from descendant fields under the registered `<fieldset>` name and then parsed if `parse` is provided.

### `formRef: React.RefObject<HTMLFormElement | null>`

Ref object for the form associated with the registered base control.

### `register(element): void`

Registers the base control element. Accepts `<input>`, `<select>`, `<textarea>`, `<fieldset>`, or a collection of checkbox / radio inputs sharing the same name.

### `change(value: Value | null): void`

Programmatically updates the control value and emits both [change](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/change_event) and [input](https://developer.mozilla.org/en-US/docs/Web/API/Element/input_event) events.

- For **standard controls**, it expects a value that matches the same type as the `defaultValue` (e.g. `string`, `string[]`, `File[]`).
- For **checked controls**, it expects a `boolean`.
- For **custom controls**, it expects a value that matches the custom `Shape`. If you provide `serialize`, the value is converted back to a form value before updating the base control.

### `blur(): void`

Emits [blur](https://developer.mozilla.org/en-US/docs/Web/API/Element/blur_event) and [focusout](https://developer.mozilla.org/en-US/docs/Web/API/Element/focusout_event) events. Does not actually move focus.

### `focus(): void`

Emits [focus](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus) and [focusin](https://developer.mozilla.org/en-US/docs/Web/API/Element/focusin_event) events. This does not move the actual keyboard focus to the base control. Use `element.focus()` instead if you want to move focus to it.

## Example

### Checkbox / Switch

```tsx
import { useControl } from '@conform-to/react/future';
import { useForm } from '@conform-to/react';
import { Checkbox } from './custom-checkbox-component';

function Example() {
  const [form, fields] = useForm({
    defaultValue: {
      newsletter: true,
    },
  });
  const control = useControl({
    defaultChecked: fields.newsletter.defaultChecked,
  });

  return (
    <>
      <input
        type="checkbox"
        name={fields.newsletter.name}
        ref={control.register}
        hidden
      />
      <Checkbox
        checked={control.checked}
        onChange={(checked) => control.change(checked)}
        onBlur={() => control.blur()}
      >
        Subscribe to newsletter
      </Checkbox>
    </>
  );
}
```

### Multi-select

```tsx
import { useControl } from '@conform-to/react/future';
import { useForm } from '@conform-to/react';
import { Select, Option } from './custom-select-component';

function Example() {
  const [form, fields] = useForm({
    defaultValue: {
      categories: ['tutorial', 'blog'],
    },
  });
  const control = useControl({
    defaultValue: fields.categories.defaultOptions,
  });

  return (
    <>
      <select
        name={fields.categories.name}
        ref={control.register}
        multiple
        hidden
      />
      <Select
        value={control.options}
        onChange={(options) => control.change(options)}
        onBlur={() => control.blur()}
      >
        <Option value="blog">Blog</Option>
        <Option value="tutorial">Tutorial</Option>
        <Option value="guide">Guide</Option>
      </Select>
    </>
  );
}
```

### File input

```tsx
import { useControl } from '@conform-to/react/future';
import { useForm } from '@conform-to/react';
import { DropZone } from './custom-file-input-component';
function Example() {
  const [form, fields] = useForm();
  const control = useControl();

  return (
    <>
      <input
        type="file"
        name={fields.attachments.name}
        ref={control.register}
        hidden
      />
      <DropZone
        files={control.files}
        onChange={(files) => control.change(files)}
        onBlur={() => control.blur()}
      />
    </>
  );
}
```

### Structural field (fieldset)

```tsx
import { BaseControl, useControl, useField } from '@conform-to/react/future';

function DateRangeField(props: { name: string }) {
  const field = useField(props.name);
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
      <CustomDateRangePicker
        value={control.payload}
        onChange={(value) => control.change(value)}
        onBlur={() => control.blur()}
      />
    </>
  );
}
```

## Tips

### Progressive enhancement

If you care about supporting form submissions before JavaScript loads, set `defaultValue`, `defaultChecked`, or `value` directly on the base control.

```jsx
// Input
<input
  type="email"
  name={fields.email.name}
  defaultValue={fields.email.defaultValue}
  ref={control.register}
  hidden
/>

// Select
<select
  name={fields.categories.name}
  defaultValue={fields.categories.defaultOptions}
  ref={control.register}
  hidden
>
  <option value=""></option>
  {fields.categories.defaultOptions.map(option => (
    <option key={option} value={option}>
      {option}
    </option>
  ))}
</select>

// Textarea
<textarea
  name={fields.description.name}
  defaultValue={fields.description.defaultValue}
  ref={control.register}
  hidden
/>
```

### Checkbox / Radio groups

You can register multiple checkbox or radio inputs as a group by passing an array of elements to `register()`. This is useful when the setup renders a set of native inputs that you want to re-use without re-implementing the group logic:

```jsx
<CustomCheckboxGroup
  ref={(el) => control.register(el?.querySelectorAll('input'))}>
  value={control.options}
  onChange={(options) => control.change(options)}
  onBlur={() => control.blur()}
/>
```

If you don't need to re-use the existing native inputs, you can always represent the group with a single hidden multi-select or text input. For complete examples, see the checkbox and radio group implementations in the [React Aria example](../../../../examples/react-aria/).

### Unknown value shape

If your custom control has a known shape, reach for a fieldset. But, if the shape is not known upfront, serializing the payload as a JSON string is often the simpler option.

Just parse or coerce that JSON string back to the original shape with `JSON.parse()` on the server.

```tsx
const { form, fields } = useForm({
  defaultValue: {
    metadata: { foo: 'bar' },
  },
  serialize(value, context) {
    if (context.name === 'metadata') {
      return typeof value === 'string' || value == null
        ? value
        : JSON.stringify(value);
    }

    return context.defaultSerialize(value);
  },
});

const control = useControl({
  defaultValue: fields.metadata.defaultValue,
  parse(payload) {
    if (typeof payload !== 'string') {
      throw new Error('Expected a string payload');
    }

    return JSON.parse(payload);
  },
  serialize(value) {
    return JSON.stringify(value);
  },
});
```
