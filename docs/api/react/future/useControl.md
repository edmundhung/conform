# useControl

> The `useControl` hook is part of Conform’s future export. These APIs are experimental and may change in minor versions. [Learn more](https://github.com/edmundhung/conform/discussions/954)

A React hook that lets you sync the state of an input and dispatch native form events from it. This is useful when emulating native input behavior — typically by rendering a hidden base input and syncing it with a custom input.

For details on when you need this hook, see the [UI Libraries Integration Guide](../../../integration/ui-libraries.md).

```ts
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

### `register: (element: HTMLInputElement | HTMLSelectElement | HTMLTextareaElement | Array<HTMLInputElement>) => void`

Registers the base input element(s). Accepts a single input or an array for groups.

### `change(value: string | string[] | File | File[] | FileList | boolean): void`

Programmatically updates the input value and emits both [change](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/change_event) and [input](https://developer.mozilla.org/en-US/docs/Web/API/Element/input_event) events.

### `blur(): void`

Emits [blur](https://developer.mozilla.org/en-US/docs/Web/API/Element/blur_event) and [focusout](https://developer.mozilla.org/en-US/docs/Web/API/Element/focusout_event) events. Does not actually move focus.

### `focus(): void`

Emits [focus](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus) and [focusin](https://developer.mozilla.org/en-US/docs/Web/API/Element/focusin_event) events. This does not move the actual keyboard focus to the input. Use `element.focus()` instead if you want to move focus to the input.

## Example Usage

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
    defualtValue: fields.categories.defaultOptions,
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
        name={fields.attachements.name}
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

If you don’t need to re-use the existing native inputs, you can always represent the group with a single hidden multi-select or text input. For complete examples, see the checkbox and radio group implementations in the [React Aria example](../../../../examples/react-aria/).
