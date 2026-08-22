# Headless UI Example

[Headless UI](https://headlessui.com/) provides accessible, unstyled React components designed to integrate with Tailwind CSS.

This Vite React project demonstrates how to use Headless UI 2.2 components with Conform and Zod 4 validation through `@conform-to/zod/v4/future`. It covers native-style fields alongside Checkbox, Combobox, Listbox, RadioGroup, and Switch.

## Integration

Headless UI's Input, Textarea, and Select receive Conform's field props directly because their native controls own the submitted values. Compound components use [`useControl`](../../docs/api/react/future/useControl.md) with a hidden native input, checkbox, or multiple select.

The adapters translate Headless UI's scalar, checked, and array value shapes and leave the visible components unnamed so each field produces one canonical set of `FormData` entries. They also preserve initial and updated defaults, restore visible state on reset, and forward blur and invalid-submission focus to the interactive component.

[`configureForms`](../../docs/api/react/future/configureForms.md#integrating-with-ui-libraries) exposes the native and compound-component mappings as typed field props. See [Integrating with UI Libraries](../../docs/integration/ui-libraries.md) for the general pattern.

| Pattern | Components | Form integration |
| --- | --- | --- |
| Native form control | Input, Textarea, Select | The interactive element owns the name and serialization |
| Unnamed compound control | Checkbox, Combobox, Listbox, RadioGroup, Switch | The Headless UI component handles interaction and focus |
| `useControl` with a registered input | Checkbox, Combobox, RadioGroup, Switch | A hidden input or checkbox owns the scalar or boolean value |
| Array registered control | Listbox | A hidden multiple select serializes repeated values |

Conform remains the source of validation and form state, while Headless UI supplies accessible interaction and field composition. The application keeps its native `<form {...form.props}>`.

## Project Structure

- [`App.tsx`](./src/App.tsx) contains the form and keeps useful explicit Conform prop mappings in nearby comments.
- [`components.tsx`](./src/components.tsx) contains the Headless UI component adapters.
- [`forms.ts`](./src/forms.ts) uses [`configureForms`](../../docs/api/react/future/configureForms.md#integrating-with-ui-libraries) to expose the mappings as typed field props.
- [`tests/index.test.ts`](./tests/index.test.ts) verifies validation, focus delegation, selection, repeated values, submission, updated defaults, and reset behavior.

## Demo

<!-- sandbox src="/examples/headless-ui" -->

Try it out on [StackBlitz](https://stackblitz.com/github/edmundhung/conform/tree/main/examples/headless-ui).

<!-- /sandbox -->
