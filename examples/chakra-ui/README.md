# Chakra UI Example

> This guide focuses on behavior specific to Chakra UI. See [Integrating with UI Libraries](../../docs/integration/ui-libraries.md) for the general concept and the [`useControl`](../../docs/api/react/future/useControl.md) API.

[Chakra UI](https://chakra-ui.com/) provides accessible React components that can be composed and styled through a shared design system.

This example demonstrates how to integrate Conform with Chakra UI 3.36 using React 19, Zod 4, and custom metadata. It covers Input, NativeSelect, Textarea, Checkbox, Switch, RadioGroup, NumberInput, PinInput, Slider, Editable, TagsInput, and FileUpload.

## Choose Native Controls When Available

Every field needs one canonical named form control. Use the native control rendered by Chakra when it already provides the required value, reset, focus, and `FormData` behavior. Otherwise, render a Conform `BaseControl` and leave Chakra's internal controls unnamed.

| Chakra component | Canonical form control | Integration |
| --- | --- | --- |
| Input, NativeSelect, Textarea | The Chakra component itself | Pass Conform's native input props directly |
| Checkbox, Switch | Checkbox `BaseControl` | Synchronize checked state through `control.checked` |
| RadioGroup, NumberInput, PinInput, Slider, Editable | Text `BaseControl` | Synchronize a string value through `control.value` |
| TagsInput | Multiple select `BaseControl` | Synchronize `string[]` through `control.options` |
| FileUpload | File `BaseControl` | Synchronize `File[]` through `control.files` |

Native controls need no adapter. For example, Input receives its name, initial value, constraint, and validation attributes directly:

```tsx
<Input
  id={field.id}
  name={field.name}
  defaultValue={field.defaultValue}
  required={field.required}
  aria-invalid={field.ariaInvalid}
  aria-describedby={field.ariaDescribedBy}
/>
```

## Use a Single Named Control

Compound controls such as NumberInput expose controlled state but do not provide the complete native behavior needed by the form. Their adapters render one named `BaseControl` registered with `useControl`:

```tsx
const inputRef = useRef<HTMLInputElement>(null);
const control = useControl({
  defaultValue,
  onFocus() {
    inputRef.current?.focus();
  },
});

return (
  <>
    <BaseControl
      name={name}
      ref={control.register}
      defaultValue={control.defaultValue ?? ''}
    />
    <NumberInput.Root
      value={control.value ?? ''}
      onValueChange={({ value }) => control.change(value)}
    >
      <NumberInput.Input ref={inputRef} />
      <NumberInput.Control />
    </NumberInput.Root>
  </>
);
```

The Chakra root remains unnamed, so the base control is the only submitted value. It gives Conform one place to manage reset, focus, validation events, and `FormData` serialization without duplicate entries.

Checkbox and Switch follow the same pattern with a checkbox `BaseControl`. Their Chakra hidden inputs remain unnamed and send user changes to Conform through the native `change` event:

```tsx
<BaseControl
  type="checkbox"
  name={name}
  value="on"
  defaultChecked={defaultChecked ?? false}
  ref={control.register}
/>
<Switch.Root checked={control.checked ?? false}>
  <Switch.HiddenInput
    ref={inputRef}
    defaultChecked={defaultChecked}
    onChange={(event) => control.change(event.currentTarget.checked)}
  />
  <Switch.Control>
    <Switch.Thumb />
  </Switch.Control>
</Switch.Root>
```

Using the native event avoids writing a stale Chakra reset callback back into the canonical control while submitted values become the new defaults. RadioGroup also uses a text `BaseControl`; its `ItemHiddenInput` elements remain focusable for keyboard interaction but use an empty name so they do not duplicate the submitted value.

## Handle Chakra Value Shapes

`useControl` exposes the native shape represented by the registered control. Each adapter translates only where Chakra uses a different shape:

| Chakra component | Chakra value | Conform value |
| --- | --- | --- |
| NumberInput, Editable | String | `control.value` |
| PinInput | Array of characters | Join or split `control.value` |
| Slider | Array of numbers | First number serialized as a string |
| Checkbox, Switch | Boolean state | Native checked value, usually `"on"` |
| RadioGroup | Selected string | `control.value` from a text input |
| TagsInput | Array of strings | `control.options` from a multiple select |
| FileUpload | Array of files | `control.files` from a file input |

For example, Chakra Slider always reports an array because it can support multiple thumbs. This example has one thumb:

```tsx
<Slider.Root
  value={[Number(control.value || 0)]}
  onValueChange={({ value }) =>
    control.change(value[0]?.toString() ?? '')
  }
>
  {/* ... */}
</Slider.Root>
```

TagsInput uses a multiple select base control so repeated values serialize as repeated `FormData` entries. FileUpload uses a file base control and intentionally does not attempt to restore file defaults, which browsers do not allow.

## Forward Focus to the Interactive Element

When Conform focuses a hidden base control after an invalid submission, the adapter forwards focus to the visible Chakra element:

| Component | Focus target |
| --- | --- |
| Checkbox | `Checkbox.HiddenInput` |
| Switch | `Switch.HiddenInput` |
| NumberInput | `NumberInput.Input` |
| PinInput | First `PinInput.Input` |
| Slider | First `Slider.Thumb` |
| RadioGroup | First item input |
| Editable | `Editable.Preview` |
| TagsInput | `TagsInput.Input` |
| FileUpload | `FileUpload.Trigger` |

The `onFocus` option passed to `useControl` performs this delegation. Native Input, NativeSelect, and Textarea already expose their canonical focusable control.

## Match Chakra Interaction Boundaries

Blur events bubble when focus moves between parts of NumberInput, PinInput, RadioGroup, Editable, TagsInput, and FileUpload. Notify Conform only when focus leaves the whole component:

```tsx
function isFocusLeaving(event: React.FocusEvent<HTMLElement>) {
  return !event.currentTarget.contains(event.relatedTarget);
}

<PinInput.Root
  onBlur={(event) => {
    if (isFocusLeaving(event)) control.blur();
  }}
>
  {/* ... */}
</PinInput.Root>
```

This preserves `shouldValidate: "onBlur"` without validating while the user moves between internal controls.

## Apply ARIA Attributes to the Accessible Control

The named base control owns serialization, but validation state must also reach the Chakra element exposed to the user. The adapters pass `invalid` and `required` to the compound root, assign Conform's field ID to the interactive element, and associate it with `field.ariaDescribedBy`.

```tsx
<Field.Root invalid={!field.valid} required={field.required}>
  <Field.Label htmlFor={field.id}>Quantity</Field.Label>
  <ExampleNumberInput
    id={field.id}
    name={field.name}
    defaultValue={field.defaultValue}
    required={field.required}
    invalid={!field.valid}
    aria-describedby={field.ariaDescribedBy}
  />
  <Field.ErrorText id={field.errorId}>{field.errors}</Field.ErrorText>
</Field.Root>
```

For RadioGroup, the fieldset legend labels the group through `aria-labelledby`. Checkbox and Switch apply the error description to their focusable Chakra hidden input. FileUpload's hidden file input is `aria-hidden`, so its visible trigger receives the description and invalid state instead.

## Preserve Defaults and Reset Behavior

String and array adapters pass `control.defaultValue` to their `BaseControl`; checked adapters pass the latest `defaultChecked` metadata to both `useControl` and their checkbox base control. Conform updates these reset baselines after update intents and progressive-enhancement results while `control.change()` continues to represent the live value.

This demo writes serializable submitted values to the URL and treats that snapshot as a new set of defaults. Calling `intent.reset()` or the browser's native `form.reset()` restores every native or base control from the same Conform defaults without remounting the form.

## Custom Metadata

The adapters can receive field metadata explicitly:

```tsx
<ExampleSlider
  id={fields.progress.id}
  name={fields.progress.name}
  defaultValue={fields.progress.defaultValue}
  required={fields.progress.required}
  invalid={!fields.progress.valid}
  aria-describedby={fields.progress.ariaDescribedBy}
/>
```

To avoid repeating that mapping at every call site, [`forms.ts`](./src/forms.ts) uses [`configureForms`](../../docs/api/react/future/configureForms.md#integrating-with-ui-libraries) to provide typed props for every control:

```tsx
import { configureForms } from '@conform-to/react/future';

const forms = configureForms({
  extendFieldMetadata(metadata) {
    return {
      get sliderProps() {
        return {
          id: metadata.id,
          name: metadata.name,
          defaultValue: metadata.defaultValue,
          required: metadata.required,
          invalid: !metadata.valid,
          'aria-describedby': metadata.ariaDescribedBy,
        } satisfies Partial<React.ComponentProps<typeof ExampleSlider>>;
      },
      // ... other component props
    };
  },
});

export const useForm = forms.useForm;
```

The application can then spread those props with full type safety. Its nearby `Equivalent to:` comments preserve the explicit mapping for readers:

```tsx
<ExampleSlider {...fields.progress.sliderProps} />
```

See [`form.tsx`](./src/form.tsx) for the complete adapters and [`forms.ts`](./src/forms.ts) for every metadata mapping.

## Demo

<!-- sandbox src="/examples/chakra-ui" -->

Try it out on [StackBlitz](https://stackblitz.com/github/edmundhung/conform/tree/main/examples/chakra-ui).

<!-- /sandbox -->
