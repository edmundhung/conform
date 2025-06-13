# useControl

> This is a future API is that might subject to change in minor versions. Pin the version of `@conform-to/react` with a tilde ranges (`~`) to avoid potential breaking changes.

A React hook that let you sync the state of the base input and dispatch native form events from the base input. For details on when you need this hook, see the [UI Libraries Integration Guide](../../../integration/ui-libraries.md).

```ts
const control = useControl(options);
```

## Options

### `defaultValue?: string | string[] | File | File[]`

The initial value of the base input. It will be used to set the value of the input when it is first registered.

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

Whether the base input should be checked by default. It will be used to set the checked state of the input when it is first registered.

```ts
const control = useControl({
  defaultChecked: true,
});
```

### `value?: string`

The value of the checkbox or radio input when it is checked. This is used to set the value attribute of the base input when it is first registered.

```ts
const control = useControl({
  defaultChecked: true,
  value: 'option-value',
});
```

### `onFocus?: () => void`

A callback function that is called when the base input is focused. Use this to delegate the focus to a custom input component.

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

The current value of the base input. It will be undefined for multi-select, file inputs, or checkbox group.

### `options: string[] | undefined`

The selected options of the base input. Use this with multi-select or checkbox groups.

### `checked: boolean | undefined`

The checked state of the base input. Use this with checkbox or radio inputs.

### `files: File[] | undefined`

The files selected with the base input. Use this with file inputs.

### `register: (element: HTMLInputElement | HTMLSelectElement | HTMLTextareaElement | Array<HTMLInputElement>) => void`

Registers the base input element. This is required to sync the state of the input with the control and emits events. You can register a checkbox/ radio groups by passing an array of input elements.

### `change(value: string | string[] | File | File[] | FileList | boolean): void`

Updates the state of the base input with both the [change](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/change_event) and [input](https://developer.mozilla.org/en-US/docs/Web/API/Element/input_event) events emitted. Use this when you need to change the input value programmatically.

### `blur(): void`

Emits the [blur](https://developer.mozilla.org/en-US/docs/Web/API/Element/blur_event) and [focusout](https://developer.mozilla.org/en-US/docs/Web/API/Element/focusout_event) events as if the user left the input. This does not actually removes keyboard focus from the current element. It just triggers the events.

### `focus(): void`

Emits the [focus](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus) and [focusin](https://developer.mozilla.org/en-US/docs/Web/API/Element/focusin_event) events as if the user focused on the input. This does not move the actual keyboard focus to the input. Use native DOM methods like `inputElement.focus()` if you want to move the focus to the input element.

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

### Checkbox / Radio groups

When using checkbox or radio groups, you can register the group by passing an array of input elements to the `register` method. This allows you to sync the state of the entire group with the control.
