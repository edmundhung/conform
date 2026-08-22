# Radix UI Example

[Radix UI](https://www.radix-ui.com/) provides accessible, unstyled React primitives for building application and design-system interfaces.

This Vite React project demonstrates how to use Radix UI 1.6 components with Conform and Zod 4 validation through `@conform-to/zod/v4/future`. It covers Checkbox, RadioGroup, Select, Slider, Switch, and ToggleGroup through the `radix-ui` package.

## Integration

The Radix components in this example use [`useControl`](../../docs/api/react/future/useControl.md) with a hidden native input. The native input owns the field name and submitted value, while the visible Radix primitive handles interaction.

The adapters leave Radix's internal inputs unnamed to avoid duplicate `FormData` entries. They translate checked, scalar, and array value shapes, preserve initial and updated defaults, restore visible state on reset, and forward blur and invalid-submission focus to the interactive component.

[`configureForms`](../../docs/api/react/future/configureForms.md#integrating-with-ui-libraries) exposes these mappings as typed field props so the form can spread them onto each adapter. See [Integrating with UI Libraries](../../docs/integration/ui-libraries.md) for the general pattern.

| Pattern | Components | Form integration |
| --- | --- | --- |
| Unnamed compound control | Checkbox, RadioGroup, Select, Slider, Switch, ToggleGroup | The Radix UI primitive handles interaction and focus |
| `useControl` with a registered input | RadioGroup, Select, Slider, ToggleGroup | A hidden input owns the scalar value |
| Checkbox registered control | Checkbox, Switch | A hidden checkbox owns the boolean value |

Conform remains the source of validation and form state, while Radix UI supplies accessible interaction primitives. The application keeps its native `<form {...form.props}>`.

## Project Structure

- [`App.tsx`](./src/App.tsx) contains the form and keeps useful explicit Conform prop mappings in nearby comments.
- [`form.tsx`](./src/form.tsx) contains the Radix UI component adapters.
- [`forms.ts`](./src/forms.ts) uses [`configureForms`](../../docs/api/react/future/configureForms.md#integrating-with-ui-libraries) to expose the mappings as typed field props.
- [`tests/index.test.ts`](./tests/index.test.ts) verifies validation focus and blur, submission, updated defaults, reset behavior, and modal interaction.

## Demo

<!-- sandbox src="/examples/radix-ui" -->

Try it out on [StackBlitz](https://stackblitz.com/github/edmundhung/conform/tree/main/examples/radix-ui).

<!-- /sandbox -->
