# Base UI Example

[Base UI](https://base-ui.com/) provides unstyled, accessible React primitives.

This Vite React project demonstrates how to use `@base-ui/react` directly with Conform and Zod 4 validation. Unlike `examples/shadcn-base-ui`, it does not use shadcn/ui components, generated registries, or copied shadcn component code.

## Integration

Base UI Input and the native textarea rendered by Field.Control receive Conform's `name` and `defaultValue` directly. Base UI's Field generates and associates the control, label, description, and error IDs, and propagates the invalid state to its controls. Compound controls use [`useControl`](../../docs/api/react/future/useControl.md) with a [`BaseControl`](../../docs/api/react/future/BaseControl.md). The base control is the single named form control, while the Base UI primitive handles interaction.

The adapters leave Base UI's internal inputs unnamed to avoid duplicate `FormData` entries. They translate boolean, array, and numeric values, forward value changes to the base control, move focus to the interactive element after invalid submission, and report blur only when focus leaves a compound control. `Field.Error` uses Base UI's external-validation mode so its context associates Conform's error with every nested control, while `Field.Item` associates each checkbox and radio with its own label. Because `useControl` follows Conform's current default, reset restores updated defaults without remounting the components.

| Pattern | Components | Form integration |
| --- | --- | --- |
| Native form control | Input, textarea | The interactive element owns the name and serialization |
| Base UI internal input | Checkbox, CheckboxGroup, RadioGroup, Select, Combobox, NumberField, Slider, Switch | Unnamed; used only for interaction and accessible focus |
| `useControl` with `BaseControl` | All compound controls above | A hidden input or checkbox owns scalar and boolean values |
| Array `BaseControl` | CheckboxGroup | A hidden multiple select serializes repeated values |

Conform remains the only source of validation and form state. Base UI supplies field structure and accessible interaction, and the application keeps its native `<form {...form.props}>`. See [Integrating with UI Libraries](../../docs/integration/ui-libraries.md) for the general pattern.

## Project Structure

- [`App.tsx`](./src/App.tsx) contains the form, schema, URL-backed defaults, and explicit Conform prop mappings.
- [`components.tsx`](./src/components.tsx) contains only the compound-control adapters; field composition stays in `App.tsx`.
- [`forms.ts`](./src/forms.ts) uses [`configureForms`](../../docs/api/react/future/configureForms.md#integrating-with-ui-libraries) to expose those mappings as typed field props.
- [`tests/index.test.ts`](./tests/index.test.ts) verifies validation, submission, focus, updated defaults, and reset behavior.

## Demo

<!-- sandbox src="/examples/base-ui" -->

Try it out on [StackBlitz](https://stackblitz.com/github/edmundhung/conform/tree/main/examples/base-ui).

<!-- /sandbox -->
