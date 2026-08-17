# shadcn/ui with Base UI

[shadcn/ui](https://ui.shadcn.com/) provides composable components that can be generated with [Base UI](https://base-ui.com/) primitives instead of Radix UI.

This Vite project demonstrates how to use the Base UI variant of shadcn/ui with React 19, Conform, Tailwind CSS 4, and Zod 4 validation through `@conform-to/zod/v4/future`. It is the direct counterpart to the Radix-based [`shadcn-ui`](../shadcn-ui) example.

## Integration

When a shadcn component renders a normal `<input>`, `<select>`, or `<textarea>`, the example passes Conform's field props directly to it. Compound controls use [`useControl`](../../docs/api/react/future/useControl.md) with a [`BaseControl`](../../docs/api/react/future/BaseControl.md). The base control is the canonical named form control, while the visible compound component is controlled from its value and left unnamed to avoid duplicate `FormData` entries.

The adapters translate Base UI's event and value shapes into `control.change`, delegate validation focus to the interactive element, and report blur only after focus leaves a compound control or its popup. Because the visible state follows the base control, initial and updated defaults, Conform reset intents, validation, and string serialization stay synchronized without remounting the form.

The interests combobox uses a multiple `BaseControl`, producing one `FormData` entry per selected value. This demonstrates array-valued form data without encoding the array into a scalar string. See [Integrating with UI Libraries](../../docs/integration/ui-libraries.md) for the general integration pattern.

## Project Structure

- [`App.tsx`](./src/App.tsx) contains the form and shows the explicit Conform prop mappings in nearby comments.
- [`form.tsx`](./src/components/form.tsx) contains the Base UI adapters.
- [`forms.ts`](./src/forms.ts) uses [`configureForms`](../../docs/api/react/future/configureForms.md#integrating-with-ui-libraries) to expose those mappings as typed field props.
- [`tests/index.test.ts`](./tests/index.test.ts) verifies submission, reset, validation, focus, and repeated-value serialization.

## Demo

<!-- sandbox src="/examples/shadcn-base-ui" -->

Try it on [StackBlitz](https://stackblitz.com/github/edmundhung/conform/tree/main/examples/shadcn-base-ui).

<!-- /sandbox -->
