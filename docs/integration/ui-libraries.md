# Integrating with UI Libraries

In this guide, we'll walk through how to integrate Conform with custom input components.

## Concept

Conform supports native inputs out of the box by listening for form events like `input`, `focusout`, and `reset` on the document. This means simple custom components that wrap native elements (e.g. a styled `<input>`) typically work without extra setup.

However, more complex inputs like `<Select />`, `<DatePicker />`, or custom file uploaders often involve additional layers of abstraction. These layers interfere with how the browser emits native form events, making it harder for Conform to track user interactions.

To solve this, we provide the [`useControl`](../api/react/useControl.md) hook. It lets you manually connect a hidden base input to a custom UI component and dispatch native events in response to user interaction.

## Emulating Native Inputs

There are multiple ways to wire up a base input with `useControl`:

- In some cases, you may be able to **re-use an input rendered by the UI library**. This can help with progressive enhancement — for instance, when a user clicks on a styled label that toggles a real hidden checkbox using standard HTML behavior. The form still submits correctly even if JavaScript hasn't loaded.

- But not all custom inputs enable this. Some UI libraries render hidden inputs and update their value via JavaScript after interacting with entirely separate elements. These setups won't work before JavaScript loads and may trigger their event handler in an unexpected order — for example, calling `onChange` before updating the input's value.

- Because `useControl` itself requires JavaScript, the benefits of re-using library-provided inputs are marginal. We recommend **rendering your own base input** unless you're confident it helps with progressive enhancement and behaves as expected.

The `useControl` hook gives you a control object that manages the input value and provides methods to trigger form events. Here are the main steps to integrate it:

1. **Register a base input**

   - Render a hidden native input element (e.g. `<input hidden />`) and register it with `control.register()`.
   - This serves as the authoritative source of the value and emits native form events.

2. **Emit form events**

   - Use `control.change()` and `control.blur()` in your custom component's `onChange` and `onBlur` handlers.

3. **Make it controlled**

   - Use `control.value`, `control.options`, `control.checked`, or `control.files` to sync the custom component with the current state.

4. **Delegate focus (optional)**

   - If your base input is hidden, use the `onFocus` callback in `useControl` to forward focus to the custom input for accessibility.

### Example

```tsx
import { useControl } from '@conform-to/react/future';
import { useForm } from '@conform-to/react';
import { Input } from 'custom-ui-library';

function MyInput({ name, defaultValue }) {
  const control = useControl({ defaultValue });

  return (
    <>
      <input name={name} ref={control.register} hidden />
      <Input
        value={control.value}
        onChange={(value) => control.change(value)}
        onBlur={() => control.blur()}
      />
    </>
  );
}
```

### Input Type Differences

Input types contribute to form data in different ways when it comes to form submission. Here's a quick reference:

- **Text Inputs**: Straightforward. When empty, the value is an empty string.
- **Checkboxes / Radios**:

  - Default value is `'on'` unless `value` is specified.
  - If checked, the value is submitted; if unchecked, it's omitted.

- **Select (single)**: Value is the selected option's `value`. Defaults to the first option.
- **Select (multiple)**: Represents an array of selected values. If none selected, no entry in `FormData`.
- **File Inputs**: Yields one or more `File` objects. If empty, `FormData` omits the field.
- **Other inputs**: Behave like text inputs. Their `type` adds context but doesn't affect how data is submitted.

## Examples

We've prepared examples for integrating with popular UI libraries:

- [React Aria Components](../../examples/react-aria/)
- [Shadcn UI](../../examples/shadcn-ui/)
- [Radix UI](../../examples/radix-ui/)
- [Chakra UI](../../examples/chakra-ui/)
- [Headless UI](../../examples/headless-ui/)
- [Material UI](../../examples/material-ui/)

If the library you're using isn't listed or you run into issues, [open a discussion](https://github.com/edmundhung/conform/discussions) — we're happy to help. Contributions are also welcome if you'd like to share an example.
