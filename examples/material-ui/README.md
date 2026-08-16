# Material UI Example

[Material UI](https://mui.com/material-ui) provides React components that implement Google's Material Design system.

This Vite React project demonstrates how to use Material UI 9.2 form components with Conform and Zod 4 validation.

## Integration

If a Material UI component renders a normal `<input>`, `<select>`, or group of radio inputs, the example passes Conform's field props directly to it. This applies to TextField, Select, Checkbox, RadioGroup, and Switch.

The Select example enables Material UI's native mode so the rendered `<select>` remains the canonical control when Conform supplies updated defaults or resets the form.

Autocomplete, NumberField, Rating, and Slider use [`useControl`](../../docs/api/react/future/useControl.md) with a [`BaseControl`](../../docs/api/react/future/BaseControl.md). The base control holds the field name, default value, and serialized value, while the Material UI component handles interaction. The adapters translate component values to strings, restore updated defaults on reset, delegate validation focus, report blur, and forward invalid state and error descriptions to the interactive element.

The visible controls remain unnamed so `BaseControl` is the only serialized field. Material UI Rating always creates presentation radio inputs, so its adapter explicitly disassociates those inputs from the form to avoid duplicate `FormData` entries. NumberField follows the Material UI outlined recipe composed from Base UI NumberField and Material UI form primitives.

See [Integrating with UI Libraries](../../docs/integration/ui-libraries.md) for the general pattern.

## Project Structure

- [`App.tsx`](./src/App.tsx) contains the example form and shows the explicit Conform prop mappings in nearby comments.
- [`form.tsx`](./src/form.tsx) contains the Material UI component adapters.
- [`forms.ts`](./src/forms.ts) uses [`configureForms`](../../docs/api/react/future/configureForms.md#integrating-with-ui-libraries) to expose those mappings as typed field props.
- [`tests/index.test.ts`](./tests/index.test.ts) verifies submission, updated defaults, reset, validation, focus, and serialization behavior.

## Demo

<!-- sandbox src="/examples/material-ui" -->

Try it out on [StackBlitz](https://stackblitz.com/github/edmundhung/conform/tree/main/examples/material-ui).

<!-- /sandbox -->
