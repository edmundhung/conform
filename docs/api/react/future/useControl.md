# useControl

> The `useControl` hook is part of Conform's future export. These APIs are experimental and may change in minor versions. [Learn more](https://github.com/edmundhung/conform/discussions/954)

A React hook that syncs custom UI components with Conform by bridging them to a hidden native input. Use it when integrating components like date pickers, rich selects, or toggles from UI libraries.

For details on when you need this hook, see the [UI Libraries Integration Guide](../../../integration/ui-libraries.md).

```ts
import { useControl } from '@conform-to/react/future';

const control = useControl(options);
```

## Options

### `defaultValue?: string | string[] | File | File[]`

The initial value of the base input. It will be used to set the value when the input is first registered.

```ts
// e.g. Text input
const control = useControl({
  defaultValue: 'my default value',
});
// e.g. Multi-select
const control = useControl({
  defaultValue: ['option-1', 'option-3'],
});
```

### `defaultChecked?: boolean`

Whether the base input should be checked by default. It will be applied when the input is first registered.

```ts
const control = useControl({
  defaultChecked: true,
});
```

### `value?: string`

The value of a checkbox or radio input when checked. This sets the value attribute of the base input.

```ts
const control = useControl({
  defaultChecked: true,
  value: 'option-value',
});
```

### `defaultPayload?: Shape`

Initial payload snapshot for structural controls (for example, controls that render a hidden `fieldset` with nested inputs).

Use this when a single logical field maps to multiple hidden inputs and the structure may change.

```ts
const control = useControl({
  defaultPayload: {
    start: '2026-01-01',
    end: '2026-01-07',
  },
});
```

### `parse?: (payload: unknown) => Shape`

Optional parser for coercing `payload` / `defaultPayload` into a typed shape.

If the parser throws, `useControl` rethrows with additional context (field name and payload preview) to make debugging easier.

```ts
const control = useControl<{ start: string; end: string }>({
  defaultPayload: { start: '2026-01-01', end: '2026-01-07' },
  parse(payload) {
    return DateRangeSchema.parse(payload);
  },
});
```

### `onFocus?: () => void`

A callback function that is triggered when the base input is focused. Use this to delegate focus to a custom input.

```ts
const control = useControl({
  onFocus() {
    controlInputRef.current?.focus();
  },
});
```

## Returns

A control object. This gives you access to the state of the input with helpers to emulate native form events.

### `value: string | undefined`

Current value of the base input. Undefined if the registered input is a multi-select, file input, or checkbox group.

### `options: string[] | undefined`

Selected options of the base input. Defined only when the registered input is a multi-select or checkbox group.

### `checked: boolean | undefined`

Checked state of the base input. Defined only when the registered input is a single checkbox or radio input.

### `files: File[] | undefined`

Selected files of the base input. Defined only when the registered input is a file input.

### `defaultPayload: Payload | undefined`

Rendered payload used as the source for hidden base input(s).

For simple native controls, this mirrors `defaultValue` / `defaultChecked`. For structural controls, this tracks the latest rendered payload shape.

### `payload: Payload | undefined`

Current payload snapshot derived from the registered base input(s).

For structural controls, this is reconstructed from descendant fields under the registered fieldset name.

### `register: (element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | HTMLFieldSetElement | HTMLCollectionOf<HTMLInputElement> | NodeListOf<HTMLInputElement>) => void`

Registers the base input element(s). Accepts a single input or an array for groups.

### `change(value: Payload | null): void`

Programmatically updates the input value and emits both [change](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/change_event) and [input](https://developer.mozilla.org/en-US/docs/Web/API/Element/input_event) events.

### `blur(): void`

Emits [blur](https://developer.mozilla.org/en-US/docs/Web/API/Element/blur_event) and [focusout](https://developer.mozilla.org/en-US/docs/Web/API/Element/focusout_event) events. Does not actually move focus.

### `focus(): void`

Emits [focus](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus) and [focusin](https://developer.mozilla.org/en-US/docs/Web/API/Element/focusin_event) events. This does not move the actual keyboard focus to the input. Use `element.focus()` instead if you want to move focus to the input.

## Example

### Checkbox / Switch

```tsx
import { useControl } from '@conform-to/react/future';
import { useForm } from '@conform-to/react';
import { Checkbox } from './custom-checkbox-component';

function Example() {
  const [form, fields] = useForm({
    defaultValues: {
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
    defaultValues: {
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
import { HiddenInput, useControl } from '@conform-to/react/future';

function DateRangeField(props: { name: string; defaultPayload: unknown }) {
  const control = useControl<{ start: string; end: string }>({
    defaultPayload: props.defaultPayload,
    parse(payload) {
      return DateRangeSchema.parse(payload);
    },
  });

  return (
    <>
      <HiddenInput
        type="fieldset"
        name={props.name}
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
}
```

## Tips

### Progressive enhancement

If you care about supporting form submissions before JavaScript loads, set `defaultValue`, `defaultChecked`, or `value` directly on the base input. This ensures correct values are included in the form submission. Otherwise, `useControl` will handle it once the app is hydrated.

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
