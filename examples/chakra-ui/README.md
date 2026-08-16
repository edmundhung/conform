# Chakra UI Example

[Chakra UI](https://chakra-ui.com/) provides accessible React components that can be composed and styled through a shared design system.

This Vite React project demonstrates how to use Chakra UI form components with Conform and Zod validation.

## Integration

If a Chakra component renders a normal `<input>`, `<select>`, or `<textarea>`, the example passes Conform's field props directly to it. Other components use [`useControl`](../../docs/api/react/future/useControl.md) with a [`BaseControl`](../../docs/api/react/future/BaseControl.md). The base control holds the field name and submitted value, while the Chakra component handles the interaction.

The adapters keep Chakra's internal inputs unnamed to avoid duplicate `FormData` entries. They also translate Chakra's value shapes and forward focus, blur, and validation attributes to the interactive component. See [Integrating with UI Libraries](../../docs/integration/ui-libraries.md) for the general pattern.

## Project Structure

- [`App.tsx`](./src/App.tsx) contains the example form and shows the explicit Conform prop mappings in nearby comments.
- [`form.tsx`](./src/form.tsx) contains the Chakra component adapters.
- [`forms.ts`](./src/forms.ts) uses [`configureForms`](../../docs/api/react/future/configureForms.md#integrating-with-ui-libraries) to expose those mappings as typed field props.
- [`tests/index.test.ts`](./tests/index.test.ts) verifies submission, reset, validation, and focus behavior.

## Demo

<!-- sandbox src="/examples/chakra-ui" -->

Try it out on [StackBlitz](https://stackblitz.com/github/edmundhung/conform/tree/main/examples/chakra-ui).

<!-- /sandbox -->
